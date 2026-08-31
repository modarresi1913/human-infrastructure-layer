# Contributing to Human Infrastructure Layer

Thank you for your interest in building the physical bridge between AI and the real world.

## Areas of Contribution

### 📦 SDK Development
We maintain SDKs in TypeScript and Python. Contributions to add features, fix bugs, or improve documentation are welcome.

```
sdk/
├── typescript/    # npm: @hil/sdk
├── python/        # pip: hil-sdk
└── go/            # planned
```

### 🧪 Testnet Operators
We need real humans to test the protocol. If you want to become a testnet operator:

1. Join our [Discord](https://discord.gg/hil)
2. Complete the onboarding flow in `#operators`
3. Start receiving test tasks and earn testnet USDC

### 📖 Documentation
Docs live at [docs.hil.dev](https://docs.hil.dev). Improvements to guides, API references, and tutorials are high-impact contributions.

### 🐛 Bug Reports
Please use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md) and include:
- SDK version
- Minimal reproduction code
- Expected vs. actual behavior

### 💡 Feature Requests
Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md). We prioritize features that:
- Unblock AI agent framework integrations (LangChain, CrewAI, AutoGen)
- Improve operator experience in emerging markets
- Enhance trust scoring accuracy

## Development Setup

```bash
# Clone the repo
git clone https://github.com/hil-dev/hil.git && cd hil

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Run local development server
npm run dev

# Run tests
npm test

# Lint
npm run lint
```

## Code Style

- TypeScript strict mode
- ESLint + Prettier (config included)
- All public functions must have JSDoc
- All new endpoints must have OpenAPI schema

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(sdk): add sanity_check method
fix(orchestration): resolve race condition in operator matching
docs(api): update verify_identity response schema
```

## License

Contributions are accepted under the [Business Source License 1.0](LICENSE). See LICENSE for details.

---

*Building the hands that AI needs.*