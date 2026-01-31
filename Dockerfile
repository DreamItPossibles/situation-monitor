# 使用轻量级 Node.js 镜像
FROM node:20-slim AS builder

WORKDIR /app

# 复制依赖文件并安装
COPY package*.json ./
RUN npm install

# 复制所有源代码
COPY . .

# 编译项目
RUN npm run build

# 运行阶段
FROM node:20-slim

WORKDIR /app

# 只复制编译后的文件和必要的依赖
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "build/index.js"]
