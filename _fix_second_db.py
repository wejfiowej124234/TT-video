import pathlib

p = pathlib.Path("docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md")
t = p.read_text(encoding="utf-8")
wrong = "**§10.5** **DB/E2E** 仍 **`[ ]**）**"
right = "**§10.5** **DB/E2E** 仍 **`[ ]`**）；**"
if wrong not in t:
    print("wrong pattern not found")
else:
    t = t.replace(wrong, right, 1)
    p.write_text(t, encoding="utf-8")
    print("fixed once")
