PROPERTY-CONSTRAINED CVAE ARCHITECTURE
======================================

INPUT LAYER
├── SELFIES Sequence (41 tokens, 66 vocab)
└── Odor Condition Vector (154D)

EMBEDDING LAYER
├── Token Embedding (66→32D)
└── Odor Projection (154→128D)

ENCODER
└── BiGRU (160D input → 256D hidden, 2 layers)

LATENT SPACE
├── Latent μ (64D)
├── Latent logvar (64D)
└── Reparameterization: z = μ + ε·exp(0.5·logvar)

PROPERTY PREDICTION
└── Predictor (MW, LogP, Rings, RotBonds)

DECODER
├── Initialization ([z; odor] → 128D)
├── GRU Decoder (128D hidden, 2 layers)
└── Output Projection (128D → 66)

OUTPUT
└── Generated SELFIES (41 tokens)

TRAINING SPECS
├── Batch: 16, Optimizer: AdamW (lr=0.0005)
├── Early Stopping: Epoch 9/20
└── Loss Weights: Recon:1.0, KL:0.1, Property:1.0, Dist:0.5
