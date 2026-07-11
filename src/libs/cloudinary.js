import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import mime from "mime-types"; // Asegúrate de instalarlo: npm install mime-types

dotenv.config();

const region = process.env.AMAZON_REGION?.trim();
const bucketName = process.env.AMAZON_BUCKET_NAME?.trim();

const getS3 = () => {
  if (!region || !bucketName || !process.env.ACCES_KEY_BUCKET_USER_S3 || !process.env.SECRET_ACCESS_KEY_BUCKET_USER_S3) {
    const error = new Error("El almacenamiento de archivos no está configurado");
    error.status = 503;
    throw error;
  }
  return new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.ACCES_KEY_BUCKET_USER_S3,
    secretAccessKey: process.env.SECRET_ACCESS_KEY_BUCKET_USER_S3,
  },
  });
};

/* ----------------------- IMÁGENES ----------------------- */

// Función para subir imágenes
export async function uploadImage({ filePath }) {
  const fileContent = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const key = `uploads/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: fileContent,
    ContentDisposition: "inline",
    ContentType: mime.lookup(filePath) || "image/jpeg",
  });

  await getS3().send(command);

  const url = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
  return { key, url };
}

// Función para eliminar imágenes
export async function deleteImage(key) {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  await getS3().send(command);
  return { key };
}

/* ----------------------- VIDEOS ----------------------- */

// Función para subir videos
export async function uploadVideo({ filePath }) {
  const fileContent = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const key = `uploads/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: fileContent,
    ContentType: "video/mp4", // Ajusta el Content-Type según el formato de video
  });

  await getS3().send(command);

  return {
    key,
    url: `https://${bucketName}.s3.${region}.amazonaws.com/${key}`,
  };
}

export async function deleteVideo(key) {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await getS3().send(command);

  return { key };
}
