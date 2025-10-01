# Step 1: Build stage
FROM node:18-alpine AS builder

# กำหนด working directory
WORKDIR /app

# copy package.json ก่อนเพื่อติดตั้ง dependencies
COPY package.json package-lock.json* yarn.lock* ./

# ติดตั้ง dependencies
RUN npm install --legacy-peer-deps

# copy source code ทั้งหมด
COPY . .

# build Expo web
RUN npx expo export:web
RUN npm install expo --legacy-peer-deps
# Step 2: Serve stage
FROM nginx:alpine

# copy build files จาก builder ไป nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# copy nginx config (optional)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]