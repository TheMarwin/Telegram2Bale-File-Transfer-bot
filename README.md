# Telegram → Bale File Forwarder Bot

A Cloudflare Worker bot that receives files from **Telegram** and forwards them to each user's own **Bale** account.

---

## English

### Features

* Forward Telegram files to Bale
* Supports:

  * Documents
  * Photos
  * Videos
  * Audio files
* Preserves original file names (when Telegram provides them)
* User-specific Bale ID registration
* Stores user mappings using Cloudflare KV
* `/changeid` command for updating Bale ID

---

## How it works

1. User starts the Telegram bot
2. Bot asks for user's **Bale numeric ID**
3. User sends their Bale ID
4. Bot stores:

```text
telegram_user_id -> bale_user_id
```

5. From now on, every file sent to the bot gets forwarded to that user's Bale account.

---

## Requirements

* Cloudflare account
* Cloudflare Workers enabled
* Cloudflare KV namespace
* Telegram Bot Token (from @BotFather)
* Bale Bot Token

---

## Cloudflare Setup

### 1. Create KV Namespace

Go to:

`Cloudflare Dashboard → Storage & Databases → KV`

Create namespace:

```text
user-mapping
```

---

### 2. Bind KV to Worker

Go to:

`Workers → Your Worker → Settings → Bindings`

Add:

```text
Variable Name: USER_KV
Namespace: user-mapping
```

---

## Environment Variables / Secrets

Store these in Cloudflare Worker variables:

```text
BOT_TOKEN
BALE_BOT_TOKEN
```

You can add them from:

`Workers → Settings → Variables and Secrets`

---

## Deploy

Using Wrangler:

```bash
wrangler deploy
```

---

## Register Telegram Webhook

After deployment open:

```text
https://your-worker-domain.workers.dev/registerWebhook
```

This will register Telegram webhook automatically.

---

## Commands

### `/start`

Register Bale ID

### `/changeid`

Change existing Bale ID

---

## Important Note

For receiving files in Bale:

Users must start your Bale bot at least once.

Otherwise Bale API may reject sending files.

---

# فارسی

## معرفی

این پروژه یک ربات مبتنی بر **Cloudflare Workers** است که فایل‌های ارسال‌شده در **تلگرام** را دریافت می‌کند و به اکانت شخصی همان کاربر در **بله** ارسال می‌کند.

---

## قابلیت‌ها

* انتقال فایل از تلگرام به بله
* پشتیبانی از:

  * فایل
    n  - عکس
  * ویدیو
  * فایل صوتی
* ذخیره آیدی اختصاصی بله برای هر کاربر
* ذخیره اطلاعات کاربران با Cloudflare KV
* امکان تغییر آیدی با دستور `/changeid`
* حفظ نام اصلی فایل‌ها

---

## نحوه کار

1. کاربر ربات تلگرام را استارت می‌کند
2. ربات آیدی عددی بله را درخواست می‌کند
3. کاربر آیدی بله را ارسال می‌کند
4. اطلاعات زیر ذخیره می‌شود:

```text
telegram_user_id -> bale_user_id
```

5. از این به بعد هر فایلی ارسال شود، مستقیم به بله همان کاربر می‌رود.

---

## پیش‌نیازها

* اکانت Cloudflare
* فعال بودن Workers
* ساخت KV Namespace
* توکن ربات تلگرام از @BotFather
* توکن ربات بله

---

## ساخت KV

مسیر:

`Cloudflare Dashboard → Storage & Databases → KV`

یک namespace بساز:

```text
user-mapping
```

---

## اتصال KV به Worker

مسیر:

`Workers → Settings → Bindings`

مقادیر:

```text
Variable Name: USER_KV
Namespace: user-mapping
```

---

## تنظیم متغیرها

در بخش Variables and Secrets این موارد را اضافه کن:

```text
BOT_TOKEN
BALE_BOT_TOKEN
```

---

## دیپلوی

```bash
wrangler deploy
```

---

## ثبت Webhook

بعد از deploy این آدرس را باز کن:

```text
https://your-worker-domain.workers.dev/registerWebhook
```

---

## دستورات

### `/start`

ثبت آیدی بله

### `/changeid`

تغییر آیدی بله

---

## نکته مهم

کاربر باید حداقل یک بار ربات بله را استارت کرده باشد.

در غیر این صورت بله ممکن است فایل را دریافت نکند.

---

## Suggested Repository Structure

```text
project/
 ├── worker.js
 ├── README.md
 ├── wrangler.toml
 └── .gitignore
```

---

Made with caffeine, bugs, and questionable life decisions ☕💀
