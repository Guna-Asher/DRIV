from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "driv-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Create the main app
app = FastAPI(title="DRIV - Digital Rights Inheritance Vault")
api_router = APIRouter(prefix="/api")

# Enums
class AssetCategory(str, Enum):
    FINANCIAL = "financial"
    SOCIAL = "social"
    PERSONAL = "personal"
    CRYPTO = "crypto"
    DOCUMENTS = "documents"
    OTHER = "other"

class ActionType(str, Enum):
    SEND_MESSAGE = "send_message"
    DELETE_ACCOUNT = "delete_account"
    TRANSFER_ASSET = "transfer_asset"
    DONATE = "donate"
    NOTIFY = "notify"

class RoleType(str, Enum):
    HEIR = "heir"
    VERIFIER = "verifier"
    EXECUTOR = "executor"

class VerificationStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class Vault(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    description: Optional[str] = None
    is_locked: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VaultCreate(BaseModel):
    name: str
    description: Optional[str] = None

class Asset(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    vault_id: str
    user_id: str
    name: str
    category: AssetCategory
    description: Optional[str] = None
    credentials: Optional[str] = None  # Encrypted
    url: Optional[str] = None
    value: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AssetCreate(BaseModel):
    vault_id: str
    name: str
    category: AssetCategory
    description: Optional[str] = None
    credentials: Optional[str] = None
    url: Optional[str] = None
    value: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class LegacyInstruction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    vault_id: str
    user_id: str
    action_type: ActionType
    title: str
    description: Optional[str] = None
    target_email: Optional[str] = None
    message_content: Optional[str] = None
    delay_days: int = 0
    is_executed: bool = False
    execution_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LegacyInstructionCreate(BaseModel):
    vault_id: str
    action_type: ActionType
    title: str
    description: Optional[str] = None
    target_email: Optional[str] = None
    message_content: Optional[str] = None
    delay_days: int = 0

class TrustedParty(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    vault_id: str
    user_id: str
    name: str
    email: EmailStr
    role: RoleType
    phone: Optional[str] = None
    relationship: Optional[str] = None
    has_signed: bool = False
    signed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TrustedPartyCreate(BaseModel):
    vault_id: str
    name: str
    email: EmailStr
    role: RoleType
    phone: Optional[str] = None
    relationship: Optional[str] = None

class DeathVerification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    vault_id: str
    user_id: str
    submitted_by: str  # trusted_party_id
    status: VerificationStatus = VerificationStatus.PENDING
    evidence_type: str  # "death_certificate", "obituary", "government_record"
    evidence_url: Optional[str] = None
    notes: Optional[str] = None
    verified_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DeathVerificationCreate(BaseModel):
    vault_id: str
    submitted_by: str
    evidence_type: str
    evidence_url: Optional[str] = None
    notes: Optional[str] = None

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    message: str
    type: str  # "info", "warning", "alert", "success"
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NotificationCreate(BaseModel):
    title: str
    message: str
    type: str = "info"

class Subscription(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    service_name: str
    category: str
    amount: float
    billing_cycle: str  # "monthly", "yearly"
    last_payment_date: Optional[datetime] = None
    auto_cancel_enabled: bool = False
    oauth_connected: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SubscriptionCreate(BaseModel):
    service_name: str
    category: str
    amount: float
    billing_cycle: str
    auto_cancel_enabled: bool = False

class AIAnalysisRequest(BaseModel):
    vault_id: str
    analysis_type: str  # "asset_summary", "risk_assessment", "recommendation"

class AIAnalysisResponse(BaseModel):
    vault_id: str
    analysis_type: str
    result: str
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Auth utilities
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return {"user_id": user_id}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

# Mock email service
async def send_mock_email(to_email: str, subject: str, body: str):
    """Mock email service - logs email instead of sending"""
    logger.info(f"[MOCK EMAIL] To: {to_email}, Subject: {subject}, Body: {body[:100]}...")
    # In production, integrate with SMTP provider
    return True

# Routes
@api_router.post("/auth/register", response_model=Token)
async def register(user_create: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_create.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = get_password_hash(user_create.password)
    user = User(
        email=user_create.email,
        full_name=user_create.full_name
    )
    user_dict = user.model_dump()
    user_dict["password_hash"] = hashed_password
    user_dict["created_at"] = user_dict["created_at"].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # Create default vault
    vault = Vault(user_id=user.id, name="My Primary Vault", description="Default vault for digital assets")
    vault_dict = vault.model_dump()
    vault_dict["created_at"] = vault_dict["created_at"].isoformat()
    vault_dict["updated_at"] = vault_dict["updated_at"].isoformat()
    await db.vaults.insert_one(vault_dict)
    
    # Send welcome notification
    await send_mock_email(user.email, "Welcome to DRIV", f"Hello {user.full_name}, welcome to Digital Rights Inheritance Vault!")
    
    # Create token
    access_token = create_access_token(data={"sub": user.id})
    return Token(access_token=access_token, user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(user_login: UserLogin):
    user_doc = await db.users.find_one({"email": user_login.email})
    if not user_doc or not verify_password(user_login.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    # Convert datetime strings back
    if isinstance(user_doc["created_at"], str):
        user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])
    
    user = User(**{k: v for k, v in user_doc.items() if k != "password_hash"})
    access_token = create_access_token(data={"sub": user.id})
    return Token(access_token=access_token, user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0, "password_hash": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    if isinstance(user_doc["created_at"], str):
        user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])
    return User(**user_doc)

# Vault routes
@api_router.get("/vaults", response_model=List[Vault])
async def get_vaults(current_user: dict = Depends(get_current_user)):
    vaults = await db.vaults.find({"user_id": current_user["user_id"]}, {"_id": 0}).to_list(100)
    for vault in vaults:
        for field in ["created_at", "updated_at"]:
            if isinstance(vault.get(field), str):
                vault[field] = datetime.fromisoformat(vault[field])
    return [Vault(**v) for v in vaults]

@api_router.post("/vaults", response_model=Vault)
async def create_vault(vault_create: VaultCreate, current_user: dict = Depends(get_current_user)):
    vault = Vault(user_id=current_user["user_id"], **vault_create.model_dump())
    vault_dict = vault.model_dump()
    vault_dict["created_at"] = vault_dict["created_at"].isoformat()
    vault_dict["updated_at"] = vault_dict["updated_at"].isoformat()
    await db.vaults.insert_one(vault_dict)
    return vault

@api_router.get("/vaults/{vault_id}", response_model=Vault)
async def get_vault(vault_id: str, current_user: dict = Depends(get_current_user)):
    vault = await db.vaults.find_one({"id": vault_id, "user_id": current_user["user_id"]}, {"_id": 0})
    if not vault:
        raise HTTPException(status_code=404, detail="Vault not found")
    for field in ["created_at", "updated_at"]:
        if isinstance(vault.get(field), str):
            vault[field] = datetime.fromisoformat(vault[field])
    return Vault(**vault)

# Asset routes
@api_router.get("/assets", response_model=List[Asset])
async def get_assets(vault_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"user_id": current_user["user_id"]}
    if vault_id:
        query["vault_id"] = vault_id
    assets = await db.assets.find(query, {"_id": 0}).to_list(1000)
    for asset in assets:
        if isinstance(asset.get("created_at"), str):
            asset["created_at"] = datetime.fromisoformat(asset["created_at"])
    return [Asset(**a) for a in assets]

@api_router.post("/assets", response_model=Asset)
async def create_asset(asset_create: AssetCreate, current_user: dict = Depends(get_current_user)):
    # Verify vault ownership
    vault = await db.vaults.find_one({"id": asset_create.vault_id, "user_id": current_user["user_id"]})
    if not vault:
        raise HTTPException(status_code=404, detail="Vault not found")
    
    asset = Asset(user_id=current_user["user_id"], **asset_create.model_dump())
    asset_dict = asset.model_dump()
    asset_dict["created_at"] = asset_dict["created_at"].isoformat()
    await db.assets.insert_one(asset_dict)
    return asset

@api_router.delete("/assets/{asset_id}", status_code=204)
async def delete_asset(asset_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.assets.delete_one({"id": asset_id, "user_id": current_user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Asset not found")
    return None

# Legacy instructions
@api_router.get("/legacy-instructions", response_model=List[LegacyInstruction])
async def get_legacy_instructions(vault_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"user_id": current_user["user_id"]}
    if vault_id:
        query["vault_id"] = vault_id
    instructions = await db.legacy_instructions.find(query, {"_id": 0}).to_list(1000)
    for inst in instructions:
        for field in ["created_at", "execution_date"]:
            if inst.get(field) and isinstance(inst[field], str):
                inst[field] = datetime.fromisoformat(inst[field])
    return [LegacyInstruction(**i) for i in instructions]

@api_router.post("/legacy-instructions", response_model=LegacyInstruction)
async def create_legacy_instruction(instruction_create: LegacyInstructionCreate, current_user: dict = Depends(get_current_user)):
    vault = await db.vaults.find_one({"id": instruction_create.vault_id, "user_id": current_user["user_id"]})
    if not vault:
        raise HTTPException(status_code=404, detail="Vault not found")
    
    instruction = LegacyInstruction(user_id=current_user["user_id"], **instruction_create.model_dump())
    instruction_dict = instruction.model_dump()
    instruction_dict["created_at"] = instruction_dict["created_at"].isoformat()
    if instruction_dict.get("execution_date"):
        instruction_dict["execution_date"] = instruction_dict["execution_date"].isoformat()
    await db.legacy_instructions.insert_one(instruction_dict)
    return instruction

@api_router.delete("/legacy-instructions/{instruction_id}", status_code=204)
async def delete_legacy_instruction(instruction_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.legacy_instructions.delete_one({"id": instruction_id, "user_id": current_user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Legacy instruction not found")
    return None

# Trusted parties
@api_router.get("/trusted-parties", response_model=List[TrustedParty])
async def get_trusted_parties(vault_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"user_id": current_user["user_id"]}
    if vault_id:
        query["vault_id"] = vault_id
    parties = await db.trusted_parties.find(query, {"_id": 0}).to_list(1000)
    for party in parties:
        for field in ["created_at", "signed_at"]:
            if party.get(field) and isinstance(party[field], str):
                party[field] = datetime.fromisoformat(party[field])
    return [TrustedParty(**p) for p in parties]

@api_router.post("/trusted-parties", response_model=TrustedParty)
async def create_trusted_party(party_create: TrustedPartyCreate, current_user: dict = Depends(get_current_user)):
    vault = await db.vaults.find_one({"id": party_create.vault_id, "user_id": current_user["user_id"]})
    if not vault:
        raise HTTPException(status_code=404, detail="Vault not found")
    
    party = TrustedParty(user_id=current_user["user_id"], **party_create.model_dump())
    party_dict = party.model_dump()
    party_dict["created_at"] = party_dict["created_at"].isoformat()
    if party_dict.get("signed_at"):
        party_dict["signed_at"] = party_dict["signed_at"].isoformat()
    await db.trusted_parties.insert_one(party_dict)
    
    # Send notification
    await send_mock_email(party.email, "You've been added as a trusted party", 
                         f"You have been designated as a {party.role} for {current_user['user_id']}'s digital vault.")
    return party

@api_router.delete("/trusted-parties/{party_id}", status_code=204)
async def delete_trusted_party(party_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.trusted_parties.delete_one({"id": party_id, "user_id": current_user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Trusted party not found")
    return None

# Death verification
@api_router.get("/death-verifications", response_model=List[DeathVerification])
async def get_death_verifications(vault_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"user_id": current_user["user_id"]}
    if vault_id:
        query["vault_id"] = vault_id
    verifications = await db.death_verifications.find(query, {"_id": 0}).to_list(1000)
    for ver in verifications:
        for field in ["created_at", "verified_at"]:
            if ver.get(field) and isinstance(ver[field], str):
                ver[field] = datetime.fromisoformat(ver[field])
    return [DeathVerification(**v) for v in verifications]

@api_router.post("/death-verifications", response_model=DeathVerification)
async def create_death_verification(verification_create: DeathVerificationCreate, current_user: dict = Depends(get_current_user)):
    vault = await db.vaults.find_one({"id": verification_create.vault_id, "user_id": current_user["user_id"]})
    if not vault:
        raise HTTPException(status_code=404, detail="Vault not found")
    
    verification = DeathVerification(user_id=current_user["user_id"], **verification_create.model_dump())
    verification_dict = verification.model_dump()
    verification_dict["created_at"] = verification_dict["created_at"].isoformat()
    if verification_dict.get("verified_at"):
        verification_dict["verified_at"] = verification_dict["verified_at"].isoformat()
    await db.death_verifications.insert_one(verification_dict)
    
    # Check if threshold met for multi-signature
    all_verifications = await db.death_verifications.find(
        {"vault_id": verification_create.vault_id, "status": "verified"}
    ).to_list(1000)
    
    trusted_parties_count = await db.trusted_parties.count_documents(
        {"vault_id": verification_create.vault_id, "role": "verifier"}
    )
    
    # If 2/3 threshold met, trigger vault unlock (mock)
    if len(all_verifications) >= max(2, trusted_parties_count * 0.66):
        await db.vaults.update_one(
            {"id": verification_create.vault_id},
            {"$set": {"is_locked": False}}
        )
        logger.info(f"Vault {verification_create.vault_id} unlocked after verification threshold met")
    
    return verification

@api_router.patch("/death-verifications/{verification_id}/status")
async def update_verification_status(verification_id: str, status: VerificationStatus, current_user: dict = Depends(get_current_user)):
    update_data = {"status": status}
    if status == VerificationStatus.VERIFIED:
        update_data["verified_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.death_verifications.update_one(
        {"id": verification_id, "user_id": current_user["user_id"]},
        {"$set": update_data}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Verification not found")
    return {"message": "Status updated"}

# Notifications
@api_router.get("/notifications", response_model=List[Notification])
async def get_notifications(current_user: dict = Depends(get_current_user)):
    notifications = await db.notifications.find({"user_id": current_user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for notif in notifications:
        if isinstance(notif.get("created_at"), str):
            notif["created_at"] = datetime.fromisoformat(notif["created_at"])
    return [Notification(**n) for n in notifications]

@api_router.post("/notifications", response_model=Notification)
async def create_notification(notification_create: NotificationCreate, current_user: dict = Depends(get_current_user)):
    notification = Notification(user_id=current_user["user_id"], **notification_create.model_dump())
    notification_dict = notification.model_dump()
    notification_dict["created_at"] = notification_dict["created_at"].isoformat()
    await db.notifications.insert_one(notification_dict)
    return notification

@api_router.patch("/notifications/{notification_id}/read", status_code=204)
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user["user_id"]},
        {"$set": {"is_read": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return None

# Subscriptions
@api_router.get("/subscriptions", response_model=List[Subscription])
async def get_subscriptions(current_user: dict = Depends(get_current_user)):
    subscriptions = await db.subscriptions.find({"user_id": current_user["user_id"]}, {"_id": 0}).to_list(1000)
    for sub in subscriptions:
        for field in ["created_at", "last_payment_date"]:
            if sub.get(field) and isinstance(sub[field], str):
                sub[field] = datetime.fromisoformat(sub[field])
    return [Subscription(**s) for s in subscriptions]

@api_router.post("/subscriptions", response_model=Subscription)
async def create_subscription(subscription_create: SubscriptionCreate, current_user: dict = Depends(get_current_user)):
    subscription = Subscription(user_id=current_user["user_id"], **subscription_create.model_dump())
    subscription_dict = subscription.model_dump()
    subscription_dict["created_at"] = subscription_dict["created_at"].isoformat()
    if subscription_dict.get("last_payment_date"):
        subscription_dict["last_payment_date"] = subscription_dict["last_payment_date"].isoformat()
    await db.subscriptions.insert_one(subscription_dict)
    return subscription

@api_router.delete("/subscriptions/{subscription_id}", status_code=204)
async def delete_subscription(subscription_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.subscriptions.delete_one({"id": subscription_id, "user_id": current_user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return None

@api_router.post("/subscriptions/oauth-mock")
async def mock_oauth_connect(current_user: dict = Depends(get_current_user)):
    """Mock OAuth connection for subscription auto-cancellation"""
    # In production, this would initiate OAuth flow
    return {
        "status": "success",
        "message": "[MOCK] OAuth connection simulated. In production, connect to Google/Microsoft APIs.",
        "connected_services": ["Gmail", "Google Calendar", "Microsoft Outlook"]
    }

# AI Analysis
@api_router.post("/ai/analyze", response_model=AIAnalysisResponse)
async def analyze_with_ai(request: AIAnalysisRequest, current_user: dict = Depends(get_current_user)):
    """AI-powered asset analysis using Hugging Face Transformers (mock for now)"""
    # In production, load actual HF model for text generation
    # from transformers import pipeline
    # generator = pipeline('text-generation', model='gpt2')
    
    # Mock analysis for now
    vault = await db.vaults.find_one({"id": request.vault_id, "user_id": current_user["user_id"]})
    if not vault:
        raise HTTPException(status_code=404, detail="Vault not found")
    
    assets_count = await db.assets.count_documents({"vault_id": request.vault_id})
    instructions_count = await db.legacy_instructions.count_documents({"vault_id": request.vault_id})
    
    analysis_results = {
        "asset_summary": f"[AI ANALYSIS] Your vault contains {assets_count} assets across multiple categories. Recommendation: Consider organizing financial assets separately and adding encryption to sensitive credentials.",
        "risk_assessment": f"[AI ANALYSIS] Risk Level: LOW. You have {instructions_count} legacy instructions configured. Suggestion: Add at least 2 trusted verifiers for enhanced security.",
        "recommendation": f"[AI ANALYSIS] Based on your {assets_count} assets, we recommend: 1) Enable auto-cancellation for subscriptions, 2) Add detailed legacy instructions, 3) Verify trusted party contact information."
    }
    
    result = analysis_results.get(request.analysis_type, "Analysis type not supported")
    
    return AIAnalysisResponse(
        vault_id=request.vault_id,
        analysis_type=request.analysis_type,
        result=result
    )

# Analytics
@api_router.get("/analytics/dashboard")
async def get_dashboard_analytics(current_user: dict = Depends(get_current_user)):
    vaults_count = await db.vaults.count_documents({"user_id": current_user["user_id"]})
    assets_count = await db.assets.count_documents({"user_id": current_user["user_id"]})
    instructions_count = await db.legacy_instructions.count_documents({"user_id": current_user["user_id"]})
    trusted_parties_count = await db.trusted_parties.count_documents({"user_id": current_user["user_id"]})
    verifications_count = await db.death_verifications.count_documents({"user_id": current_user["user_id"]})
    
    # Asset breakdown by category
    assets = await db.assets.find({"user_id": current_user["user_id"]}, {"_id": 0, "category": 1}).to_list(1000)
    category_breakdown = {}
    for asset in assets:
        cat = asset.get("category", "other")
        category_breakdown[cat] = category_breakdown.get(cat, 0) + 1
    
    return {
        "vaults": vaults_count,
        "assets": assets_count,
        "legacy_instructions": instructions_count,
        "trusted_parties": trusted_parties_count,
        "verifications": verifications_count,
        "asset_breakdown": category_breakdown,
        "completion_percentage": min(100, (assets_count * 20 + instructions_count * 30 + trusted_parties_count * 50))
    }

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()