# ROCSPACE-INITIAL — OCI private model

This deployable creates the first **personal RocSpace model** on the OCI VM:

- **Base model:** `qwen2.5:1.5b`
- **Runtime:** Ollama in Docker
- **Personal model name:** `rocspace-initial`
- **Exposure:** loopback only (`127.0.0.1:11434`), ready to be reached through Tailscale after VM access is restored.

It is an inference/personalization layer, not foundation-model training. The model uses a custom system instruction in `Modelfile`; later phases can add private RAG data and, if suitable compute is available, a LoRA adapter.

## Why this initial profile

The current OCI VM profile previously reported 1 CPU / 16 GB RAM. A 1.5B quantized model is a practical initial target for CPU inference. Training a model from scratch is not appropriate for that machine.

## Safe deployment

From the OCI VM, with this directory available:

```bash
cd deploy/oci-personal-model
chmod +x install.sh verify.sh
./install.sh
./verify.sh
```

The model remains private by default. Do **not** map port `11434` to `0.0.0.0` or create a public API route before authentication and rate limiting are installed.

## API shape

Ollama provides local endpoints:

```text
GET  /api/tags
POST /api/generate
POST /api/chat
POST /v1/chat/completions
```

## Private Python integration

After deployment, set the private address only on a Tailscale-connected agent:

```bash
cp private-model.env.example .env.private
# set ROCSPACE_PRIVATE_MODEL_BASE to the private VM Tailscale address
source .env.private
python3 tools/roc_autonomy.py run "Reply only: ROCSPACE_INITIAL_OK" --model rocspace/initial
```

`rocspace/initial` is intentionally **not** advertised through the public API model catalog until the OCI deployment and private inference test pass.

## Next phase

1. Restore a valid OCI SSH or Run Command access path.
2. Run `install.sh` on the VM.
3. Verify the model locally.
4. Reach it over the Tailscale address only.
5. Add an authenticated `rocspace-initial/` provider route to the canonical API after verification.
