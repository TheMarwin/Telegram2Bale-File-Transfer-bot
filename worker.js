export default {
  async fetch(request, env) {
    return handleRequest(request, env);
  }
};

const BOT_WEBHOOK = "/endpoint";
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// ================= REQUEST HANDLER =================

async function handleRequest(request, env) {
  const url = new URL(request.url);

  if (url.pathname === BOT_WEBHOOK) {
    return handleWebhook(request, env);
  }

  if (url.pathname === "/registerWebhook") {
    return registerWebhook(request, env);
  }

  return new Response("Not Found", { status: 404 });
}

// ================= WEBHOOK =================

async function handleWebhook(request, env) {
  const update = await request.json();

  if (update.message) {
    await processMessage(update.message, env);
  }

  return new Response("OK");
}

// ================= REGISTER TELEGRAM WEBHOOK =================

async function registerWebhook(request, env) {
  const url = new URL(request.url);
  const webhookUrl = `${url.protocol}//${url.hostname}${BOT_WEBHOOK}`;

  const response = await fetch(
    `https://api.telegram.org/bot${env.BOT_TOKEN}/setWebhook`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: webhookUrl
      })
    }
  );

  return new Response(await response.text(), {
    headers: {
      "Content-Type": "application/json"
    }
  });
}

// ================= MESSAGE PROCESSOR =================

async function processMessage(message, env) {
  const userId = message.chat.id.toString();

  let recipientId = await env.USER_KV.get(userId);

  // start command
  if (message.text === "/start") {
    if (!recipientId) {
      await sendMessage(
        userId,
        message.message_id,
        "👋 سلام\n\nآیدی عددی بله خودتو بفرست تا ثبت بشه.\nبعد از اون هر فایلی بفرستی مستقیم به بله خودت ارسال میشه."
      );
    } else {
      await sendMessage(
        userId,
        message.message_id,
        "✅ آیدی بله شما قبلاً ثبت شده.\nفایل بفرست."
      );
    }

    return;
  }

  // change id
  if (message.text === "/changeid") {
    await env.USER_KV.delete(userId);

    await sendMessage(
      userId,
      message.message_id,
      "آیدی قبلی حذف شد.\nآیدی جدید بله رو ارسال کن."
    );

    return;
  }

  // save bale id
  if (!recipientId) {
    if (message.text && /^\d+$/.test(message.text)) {
      await env.USER_KV.put(userId, message.text);

      await sendMessage(
        userId,
        message.message_id,
        "✅ آیدی بله ثبت شد.\nاز الان فایل بفرست."
      );
    } else {
      await sendMessage(
        userId,
        message.message_id,
        "❌ لطفاً اول آیدی عددی بله خودتو ارسال کن."
      );
    }

    return;
  }

  // file handlers
  if (message.document) {
    return handleDocument(userId, recipientId, message.document, env);
  }

  if (message.photo) {
    return handlePhoto(userId, recipientId, message.photo, env);
  }

  if (message.video) {
    return handleVideo(userId, recipientId, message.video, env);
  }

  if (message.audio) {
    return handleAudio(userId, recipientId, message.audio, env);
  }

  await sendMessage(
    userId,
    message.message_id,
    "❌ فقط فایل / عکس / ویدیو / صوت بفرست."
  );
}

// ================= DOCUMENT =================

async function handleDocument(senderId, recipientId, document, env) {
  if (document.file_size > MAX_FILE_SIZE) {
    return sendMessage(senderId, null, "❌ حجم فایل خیلی زیاده.");
  }

  try {
    await sendMessage(senderId, null, "⏳ درحال ارسال...");

    const file = await getFile(document.file_id, env);
    const buffer = await downloadFile(file.file_path, env);

    const fileName =
      document.file_name ||
      file.file_path.split("/").pop();

    await sendToBale(
      recipientId,
      "sendDocument",
      "document",
      buffer,
      fileName,
      env
    );

    await sendMessage(senderId, null, "✅ فایل ارسال شد.");
  } catch (err) {
    console.error(err);
    await sendMessage(senderId, null, "❌ خطا در ارسال فایل.");
  }
}

// ================= PHOTO =================

async function handlePhoto(senderId, recipientId, photos, env) {
  try {
    await sendMessage(senderId, null, "⏳ درحال ارسال...");

    const largest = photos[photos.length - 1];

    const file = await getFile(largest.file_id, env);
    const buffer = await downloadFile(file.file_path, env);

    const fileName =
      file.file_path.split("/").pop() || "photo.jpg";

    await sendToBale(
      recipientId,
      "sendPhoto",
      "photo",
      buffer,
      fileName,
      env
    );

    await sendMessage(senderId, null, "✅ عکس ارسال شد.");
  } catch (err) {
    console.error(err);
    await sendMessage(senderId, null, "❌ خطا در ارسال عکس.");
  }
}

// ================= VIDEO =================

async function handleVideo(senderId, recipientId, video, env) {
  if (video.file_size > MAX_FILE_SIZE) {
    return sendMessage(senderId, null, "❌ حجم ویدیو خیلی زیاده.");
  }

  try {
    await sendMessage(senderId, null, "⏳ درحال ارسال...");

    const file = await getFile(video.file_id, env);
    const buffer = await downloadFile(file.file_path, env);

    const fileName =
      video.file_name ||
      file.file_path.split("/").pop() ||
      "video.mp4";

    await sendToBale(
      recipientId,
      "sendVideo",
      "video",
      buffer,
      fileName,
      env
    );

    await sendMessage(senderId, null, "✅ ویدیو ارسال شد.");
  } catch (err) {
    console.error(err);
    await sendMessage(senderId, null, "❌ خطا در ارسال ویدیو.");
  }
}

// ================= AUDIO =================

async function handleAudio(senderId, recipientId, audio, env) {
  if (audio.file_size > MAX_FILE_SIZE) {
    return sendMessage(senderId, null, "❌ حجم فایل صوتی خیلی زیاده.");
  }

  try {
    await sendMessage(senderId, null, "⏳ درحال ارسال...");

    const file = await getFile(audio.file_id, env);
    const buffer = await downloadFile(file.file_path, env);

    const fileName =
      audio.file_name ||
      file.file_path.split("/").pop() ||
      "audio.mp3";

    await sendToBale(
      recipientId,
      "sendAudio",
      "audio",
      buffer,
      fileName,
      env
    );

    await sendMessage(senderId, null, "✅ فایل صوتی ارسال شد.");
  } catch (err) {
    console.error(err);
    await sendMessage(senderId, null, "❌ خطا در ارسال فایل صوتی.");
  }
}

// ================= BALE SENDER =================

async function sendToBale(recipientId, method, fieldName, buffer, fileName, env) {
  const formData = new FormData();

  formData.append("chat_id", recipientId);
  formData.append(
    fieldName,
    new Blob([buffer]),
    fileName
  );

  const response = await fetch(
    `https://tapi.bale.ai/bot${env.BALE_BOT_TOKEN}/${method}`,
    {
      method: "POST",
      body: formData
    }
  );

  const result = await response.json();

  if (!result.ok) {
    throw new Error(result.description || "Bale API error");
  }
}

// ================= TELEGRAM API =================

async function sendMessage(chatId, replyId, text, env) {
  const body = {
    chat_id: chatId,
    text
  };

  if (replyId) {
    body.reply_to_message_id = replyId;
  }

  await fetch(
    `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }
  );
}

async function getFile(fileId, env) {
  const response = await fetch(
    `https://api.telegram.org/bot${env.BOT_TOKEN}/getFile?file_id=${fileId}`
  );

  const data = await response.json();

  return data.result;
}

async function downloadFile(filePath, env) {
  const response = await fetch(
    `https://api.telegram.org/file/bot${env.BOT_TOKEN}/${filePath}`
  );

  return await response.arrayBuffer();
}
