# クリエメイト (Creimate)

Fantia 向けのクリエイターAIツールサイト。AI数字分身・AIコンテンツ作成・AIデータ分析を対話形式で利用できます。

## 主な機能

- **AI数字分身** … 顔・声・口癖・趣味などを登録してAI分身を作成。ファンはトークンで対話（テキスト 10 / 音声 20）。好感度レベルに応じて報酬コンテンツを解放。
- **AIコンテンツ作成** … 画像・動画・音声のAI生成、文案作成。コンテンツパックとして販売可能。
- **AIデータ分析** … 収益・会話数・消費傾向・投稿閲覧数を分析し、戦略提案。
- **AIアシスタント** … 分身作成・コンテンツ生成・投稿まで、すべて対話で操作。

## 開発（ローカル）

### 1. 前端

```bash
npm install
cp .env.example .env   # 必要なら VITE_API_URL を編集
npm run dev
```

### 2. 后端（API + SQLite）

```bash
cd server
npm install
cp .env.example .env   # 必要なら PORT / FRONTEND_ORIGIN を編集
npm run dev
```

前端は `http://localhost:5173`、后端は `http://localhost:3000`。AI対話分身の保存・头像上传は后端に保存されます。

### 環境変数

- **前端** `.env`: `VITE_API_URL` = 后端地址（例: `http://localhost:3000`）
- **后端** `server/.env`: `PORT`、`FRONTEND_ORIGIN`（CORS）、`PUBLIC_URL`（头像等の絶対URL用）

## 部署（本番）

### Vercel で前端をデプロイ（你之前用过的方式）

1. 把项目推到 GitHub（或 GitLab / Bitbucket）。
2. 打开 [vercel.com](https://vercel.com)，用 GitHub 登录，**Add New Project**，选这个仓库。
3. **Root Directory** 保持为仓库根目录（前端和 `vercel.json` 在根目录）。
4. **Environment Variables** 里添加：
   - `VITE_API_URL` = 你的后端 API 地址（例如 `https://你的后端.railway.app` 或 `https://api.你的域名.com`）。  
   后端还没部署时可以先填一个占位，部署好后再在 Vercel 里改这个变量并重新部署。
5. 点击 **Deploy**。Vercel 会用 `npm run build` 构建，输出到 `dist`，并按 `vercel.json` 做 SPA 路由回退。
6. 部署完成后会得到 `https://xxx.vercel.app`。若绑了自定义域名，在 Vercel 项目里添加域名即可。

**说明**：前端只负责页面；头像、创作者配置等由后端 API 提供。请先把后端部署好（见下），再把这里的 `VITE_API_URL` 设成后端的真实地址。

### Railway で后端をデプロイ（具体步骤）

后端是常驻 Node 服务 + SQLite，需要单独部署。用 Railway 的步骤如下。

#### 1. 准备

- 把整个项目（含 `server` 文件夹）推到 **GitHub** 一个仓库里。
- 去 [railway.app](https://railway.app) 用 GitHub 登录。

#### 2. 新建项目并连仓库

1. 点 **Start a New Project**。
2. 选 **Deploy from GitHub repo**，授权后选你这个项目的仓库。
3. 选好仓库后，Railway 会问你要部署什么。选 **Add a service** 或 **Deploy now**（先部署，后面再改设置也可以）。

#### 3. 指定后端目录（Root Directory）

1. 在 Railway 里点进刚创建的这个 **Service**。
2. 打开 **Settings** 标签。
3. 找到 **Root Directory**（或 **Source** 里的 Root Directory）：
   - 填：`server`  
   - 这样 Railway 会用仓库里的 `server` 文件夹作为项目根，执行那里的 `package.json`。

#### 4. 环境变量（Variables）

在同一个 Service 里，打开 **Variables** 标签，添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `FRONTEND_ORIGIN` | `https://你的前端.vercel.app` | 前端地址，用于 CORS。Vercel 部署好后把这里换成真实地址。 |
| `PUBLIC_URL` | （先不填，见下面第 6 步） | 后端对外访问的完整地址，用来拼头像等 URL。 |
| `DATA_DIR` | `/data` | 持久化目录，和第 5 步的 Volume 挂载路径一致。 |

- **PORT** 不用自己设，Railway 会注入。
- 若还没部署前端，`FRONTEND_ORIGIN` 可先填 `*` 测试（不推荐长期用），上线前改成 Vercel 的域名。

#### 5. 持久化：挂载 Volume（重要）

Railway 默认重启/重新部署会清空磁盘，SQLite 和上传的头像会丢。需要加 Volume：

1. 在这个 Service 的 **Settings** 里找到 **Volumes**（或 **Add Volume**）。
2. 点 **Add Volume**，挂载路径填：`/data`。
3. 保存。这样容器里会多一个持久化目录 `/data`。
4. 代码里已支持：当设置了环境变量 `DATA_DIR=/data` 时，数据库和 `uploads` 都会写在 `/data` 下，重启也不会丢。

#### 6. 生成公网地址并填 PUBLIC_URL

1. 在 Service 的 **Settings** 里找到 **Networking** 或 **Generate Domain**。
2. 点 **Generate Domain**，Railway 会给你一个地址，例如：`https://xxx-production-xxxx.up.railway.app`。
3. 复制这个地址，到 **Variables** 里把 `PUBLIC_URL` 设为这个地址（不要末尾斜杠），例如：  
   `PUBLIC_URL` = `https://xxx-production-xxxx.up.railway.app`

#### 7. 部署

- 若 **Root Directory**、**Variables**、**Volume** 都设好了，保存后 Railway 会自动重新部署。
- 或到 **Deployments** 里看最新一次部署是否成功；失败可点开看日志（一般是依赖或环境变量问题）。

#### 8. 验证后端

在浏览器打开：

- `https://你的域名.up.railway.app/api/health`  
应返回 `{"ok":true}`。

再把 Vercel 前端的 **Environment Variables** 里 `VITE_API_URL` 设成这个后端地址（同上，不要末尾斜杠），重新部署前端，即可前后端联调。

---

**小结**：  
- Root Directory = `server`  
- Variables：`FRONTEND_ORIGIN`、`PUBLIC_URL`、`DATA_DIR=/data`  
- Volume 挂载到 `/data`  
- 用 Railway 生成的域名作为后端地址，填到前端的 `VITE_API_URL`。

## 技術

- **前端**: React 18 + TypeScript、Vite、React Router v6、CSS Modules
- **后端**: Node.js、Express、SQLite（better-sqlite3）、multer（ファイルアップロード）
