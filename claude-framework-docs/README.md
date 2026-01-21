# SuperClaude Framework Documentation

This folder contains the complete SuperClaude framework documentation that is automatically loaded by Claude Code from `~/.claude/`.

## 📚 Framework Overview

**SuperClaude** is an advanced command execution and intelligent routing framework for Claude Code that provides:

- **Specialized Commands**: Pre-built workflows for common development tasks
- **Intelligent Routing**: Automatic tool and persona selection
- **MCP Integration**: Seamless integration with Model Context Protocol servers
- **Multi-Agent Orchestration**: Wave-based execution for complex operations
- **Quality Gates**: 8-step validation cycle for all operations

---

## 📖 Documentation Files

### 1. `CLAUDE.md` (Entry Point)
**Size**: 123 bytes

Main entry point that references all other framework files. This is the starting point for the framework.

### 2. `COMMANDS.md` (5.7 KB)
**Command Execution Framework**

Defines all available slash commands and their functionality:

- **Development**: `/build`, `/implement`, `/design`
- **Analysis**: `/analyze`, `/troubleshoot`, `/explain`
- **Quality**: `/improve`, `/cleanup`
- **Planning**: `/task`, `/estimate`, `/workflow`
- **Testing**: `/test`
- **Documentation**: `/document`
- **Version Control**: `/git`
- **Meta**: `/index`, `/load`, `/spawn`

Each command includes:
- Auto-persona activation
- MCP server integration
- Tool orchestration
- Wave eligibility

### 3. `FLAGS.md` (8.9 KB)
**Flag System Reference**

Complete flag system with auto-activation patterns:

- **Planning**: `--plan`, `--think`, `--think-hard`, `--ultrathink`
- **Efficiency**: `--uc`, `--answer-only`, `--validate`, `--safe-mode`
- **MCP Control**: `--c7`, `--seq`, `--magic`, `--play`, `--all-mcp`
- **Delegation**: `--delegate`, `--concurrency`
- **Wave Control**: `--wave-mode`, `--wave-strategy`
- **Personas**: `--persona-[name]`
- **Introspection**: `--introspect`

Includes flag precedence rules and auto-activation logic.

### 4. `MCP.md` (11.6 KB)
**MCP Server Integration Reference**

Complete guide to Model Context Protocol server integration:

- **Context7**: Library documentation and best practices
- **Sequential**: Complex analysis and multi-step reasoning
- **Magic**: UI component generation and design systems
- **Playwright**: Browser automation and E2E testing

Includes:
- Server selection algorithm
- Workflow processes
- Integration patterns
- Error recovery strategies
- Caching and optimization

### 5. `MODES.md` (13.8 KB)
**Operational Modes Reference**

Three primary operational modes:

#### Task Management Mode
- TodoRead/TodoWrite for session tasks
- `/task` command for project management
- `/spawn` for meta-orchestration
- `/loop` for iterative enhancement

#### Introspection Mode
- Meta-cognitive analysis
- Framework troubleshooting
- Decision-making transparency
- Pattern recognition

#### Token Efficiency Mode
- Symbol system for compression
- 30-50% token reduction
- Quality preservation (≥95%)
- MCP optimization & caching

### 6. `ORCHESTRATOR.md` (22.8 KB)
**Intelligent Routing System**

Core routing intelligence for the framework:

#### Detection Engine
- Pattern recognition
- Complexity detection
- Domain identification
- Intent extraction
- Resource validation

#### Routing Intelligence
- Master routing table
- Decision trees
- Tool selection logic
- Task delegation intelligence
- Persona auto-activation

#### Quality Gates
- 8-step validation cycle
- Evidence-based validation
- Wave integration
- Completion criteria

#### Performance Optimization
- Token management
- Operation batching
- Resource allocation

### 7. `PERSONAS.md` (20.7 KB)
**Persona System Reference**

11 specialized AI personalities:

**Technical Specialists**
- `architect` - Systems design and architecture
- `frontend` - UI/UX and accessibility
- `backend` - Reliability and API design
- `security` - Threat modeling and compliance
- `performance` - Optimization and bottleneck elimination

**Process & Quality**
- `analyzer` - Root cause analysis
- `qa` - Quality assurance and testing
- `refactorer` - Code quality and technical debt
- `devops` - Infrastructure and deployment

**Knowledge & Communication**
- `mentor` - Educational guidance
- `scribe` - Professional documentation and localization

Each persona includes:
- Priority hierarchy
- Core principles
- MCP server preferences
- Optimized commands
- Auto-activation triggers
- Quality standards

### 8. `PRINCIPLES.md` (9.5 KB)
**Framework Core Principles**

Foundational principles guiding all operations:

- **Core Philosophy**: Evidence-based reasoning, minimal output, efficiency
- **SOLID Principles**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- **Design Principles**: DRY, KISS, YAGNI, Composition over Inheritance
- **Senior Developer Mindset**: Systems thinking, error handling, testing philosophy
- **Decision-Making Frameworks**: Evidence-based decisions, trade-off analysis, risk assessment
- **Quality Philosophy**: Non-negotiable standards, continuous improvement
- **Ethical Guidelines**: Human-centered design, transparency, accountability
- **AI-Driven Development**: Code generation philosophy, tool coordination, testing principles

### 9. `RULES.md` (2.5 KB)
**Actionable Rules**

Simple, actionable rules for framework operation:

- **Task Management**: TodoWrite for 3+ tasks, batch operations, quality gates
- **File Operations**: Always Read before Write/Edit, absolute paths only
- **Framework Compliance**: Check dependencies, follow patterns
- **Systematic Changes**: Complete discovery before changes

Includes Do/Don't quick reference and auto-triggers.

---

## 🎯 How the Framework Works

### 1. Request Analysis
When you make a request to Claude Code:

1. **Orchestrator** analyzes the request
2. Detects complexity, domain, and intent
3. Calculates routing scores

### 2. Intelligent Routing
Based on analysis:

1. Selects appropriate **Command** (if slash command used)
2. Activates relevant **Persona**
3. Enables necessary **MCP servers**
4. Applies optimization **Flags**
5. Determines if **Wave mode** is needed

### 3. Execution
Framework executes with:

1. **Task Management**: TodoWrite for tracking
2. **Tool Orchestration**: Optimal tool selection
3. **Quality Gates**: 8-step validation
4. **Token Efficiency**: Compression when needed

### 4. Validation
Before completion:

1. Evidence-based validation
2. Quality checks
3. Performance metrics
4. User-facing results

---

## 🚀 Usage Examples

### Example 1: Simple Analysis
```
User: "Analyze the authentication flow"

Framework:
- Command: /analyze (auto-detected)
- Persona: analyzer + security
- MCP: Sequential (complex analysis)
- Flags: --think (auto-enabled)
- Mode: Standard execution
```

### Example 2: Complex Implementation
```
User: "Build a new product search feature"

Framework:
- Command: /build
- Persona: frontend + backend
- MCP: Magic (UI) + Context7 (patterns)
- Flags: --plan, --uc (if context >75%)
- Mode: Task Management + TodoWrite
- Wave: Possibly enabled if complexity >0.7
```

### Example 3: System-Wide Improvement
```
User: "Improve performance across the entire app"

Framework:
- Command: /improve
- Persona: performance + architect
- MCP: Sequential + Playwright
- Flags: --think-hard, --delegate, --wave-mode
- Mode: Wave orchestration (5+ waves)
- Validation: Comprehensive quality gates
```

---

## 🔧 Customization

### For This Project

The project-specific `claude.md` in the root directory complements this framework by providing:

- Project context and architecture
- Technology stack details
- Development conventions
- Business logic and workflows
- Project-specific constraints

**Priority Order**:
1. Project `claude.md` (specific rules and context)
2. Framework docs (general principles and capabilities)
3. Claude's base knowledge

---

## 📝 Notes

### Why These Files Are Here

These files are copies of the global SuperClaude framework configuration from `~/.claude/`. They are provided here for:

1. **Reference**: Review framework capabilities
2. **Learning**: Understand how Claude Code works
3. **Debugging**: Troubleshoot framework behavior
4. **Transparency**: See what instructions Claude follows

### Modifications

**Do NOT modify these files** - they are read-only copies. To customize:

1. **Project-specific**: Edit `claude.md` in project root
2. **Global changes**: Edit files in `~/.claude/` directory
3. **Framework updates**: Update source files and recopy

---

## 🔗 Related Files

- `/claude.md` - Project-specific context (root directory)
- `~/.claude/` - Global framework source files
- `/README.md` - Project documentation

---

**Framework Version**: SuperClaude 3.0
**Last Updated**: January 2026
**Documentation Copied**: January 21, 2026
