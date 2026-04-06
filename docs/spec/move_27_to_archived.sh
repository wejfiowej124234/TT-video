#!/bin/bash
# 保留的 5 个核心文件
CORE_FILES=(
  "27-P0至P50开发流程勾选清单.md"
  "27-系列索引.md"
  "27-P14-实现记录.md"
  "27-P0至P50-企业级检查与人工项最佳实践填选说明.md"
  "27-P0至P47-多维度深度检查报告.md"
)

# 遍历所有 27-*.md 文件
for file in 27-*.md; do
  skip=0
  # 检查是否在核心文件列表中
  for core in "${CORE_FILES[@]}"; do
    if [ "$file" = "$core" ]; then
      skip=1
      break
    fi
  done
  
  # 如果不是核心文件，移动到 27-archived/
  if [ $skip -eq 0 ]; then
    echo "Moving: $file"
    mv "$file" "27-archived/$file"
  fi
done

echo "Done! Core files remain in spec/, others moved to 27-archived/"
