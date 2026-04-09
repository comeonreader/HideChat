# OpenClaw 监督 Codex 执行 SOP v1.0

## 目标

使用 OpenClaw 作为调度与监督层，使用 `codex exec` 作为阶段执行器，实现以下目标：

1. 文档驱动开发
2. 分阶段实现功能
3. 每阶段完成后执行验证
4. 失败可停止、可修复、可恢复
5. 不让单轮执行失控

## 核心原则

- 单轮 `codex exec` 只完成一个阶段
- 每轮必须输出状态快照
- 每轮结束必须停止
- 由 OpenClaw 决定是否进入下一阶段
- 任何数据库变更都只能通过 migration

## 标准流程

1. 扫描仓库与文档
2. 输出缺口分析和阶段计划
3. 逐阶段执行
4. 每阶段后本地验证
5. 失败进入修复轮
6. 输出状态快照
7. 用恢复脚本继续下一轮

## 脚本说明

- `scripts/run_all.sh`：顺序执行全部阶段
- `scripts/run_phase.sh`：执行单个阶段
- `scripts/verify.sh`：执行验证
- `scripts/recover.sh`：根据快照恢复

## 推荐使用方式

```bash
cp config/project.env.example .openclaw.env
bash scripts/run_all.sh
```

如果中途中断：

```bash
bash scripts/recover.sh .openclaw/state/latest_snapshot.md
```

## 阶段执行后检查点

每一阶段都必须确认：

- 改动文件列表清晰
- 测试已补
- 构建/运行通过
- 日志无明显致命错误
- 状态快照已生成
