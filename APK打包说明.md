# 小宠打卡 · 打包成安卓 APK 说明

本目录已配置好两个 GitHub Actions 工作流，无需在你电脑上安装 Android SDK / Java。

## 1. 推送到 GitHub（让网站上线 + 注册工作流）

> 因为打包环境无法直连 GitHub，这步需要你在自己电脑上执行（用 Git Bash 或你的 Git 软件）。

```bash
cd /d/AI/工作目录-workbuddy-/学习可视化/pet-pwa/github-pages
git push origin main
```

推送后：
- **Deploy to GitHub Pages** 工作流自动运行，把网站部署到
  `https://githubholiday.github.io/child_pet/`（自动开启 Pages，无需在 Settings 里手动设置）。
- 约 1 分钟后，用手机/电脑浏览器打开上面的网址确认能正常显示。

## 2. 一键生成 APK（在 GitHub 网页上点一下）

1. 打开仓库 `githubholiday/child_pet` → 顶部 **Actions** 标签。
2. 左侧选 **Build Android APK (TWA)**。
3. 右上角 **Run workflow** → 确认运行。
4. 等待 3~6 分钟（自动装 JDK + Android SDK + Bubblewrap 并编译）。
5. 运行完成后，在流程末尾的 **Artifacts** 区域下载 `child-pet-apk`（里面是 `app-release.apk`）。

> 每次想重新出包，重复第 2 步即可。应用 ID 为 `com.childpet.app`。

## 3. 安装到安卓手机

1. 把 `app-release.apk` 传到手机（微信文件传输/数据线/U盘均可）。
2. 手机会提示“允许安装未知来源应用”，在设置里授权该来源（如“文件管理”或“Chrome”）。
3. 点击 APK 完成安装，桌面出现“小宠打卡”图标。

## 4. 以后怎么更新内容？

小宠打卡的内容（任务、商品、宠物表现）都在网站里。
- 改完代码后 `git push`，网站自动更新。
- 手机上的 APK 打开的就是最新网站，**无需重新装 APK**。
- 仅当你改了应用图标/名称/包名时，才需要重新跑第 2 步出新 APK。

## 5. 进阶（可选）：去掉顶部的浏览器地址栏

TWA 默认可能短暂显示“正在 Chrome 中打开”。要全屏无地址栏，需在网站根目录放
`.well-known/assetlinks.json`，内容里的 SHA256 要与签名密钥一致。
本仓库用 CI 临时密钥签名，每次指纹不同，故未内置该文件。
如需稳定全屏，可：
- 自己生成固定 keystore，把指纹写进 `assetlinks.json` 并提交；
- 或在 `build-apk.yml` 里改用你自己的 keystore。

## 备选方案：PWABuilder（无需 GitHub Actions）

网站上线后，直接打开 https://www.pwabuilder.com ，输入
`https://githubholiday.github.io/child_pet/` → Build → Android → 下载。
（PWABuilder 产出的是 Android 工程/包，安装方式与上面一致。）
