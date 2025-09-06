import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import mime from "mime-types"; // Asegúrate de instalarlo: npm install mime-types

dotenv.config();

const s3 = new S3Client({
  region: process.env.AMAZON_REGION.trim(),
  credentials: {
    accessKeyId: process.env.ACCES_KEY_BUCKET_USER_S3,
    secretAccessKey: process.env.SECRET_ACCESS_KEY_BUCKET_USER_S3,
  },
});

const bucketName = process.env.AMAZON_BUCKET_NAME;

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
    ACL: "public-read", // Si tu bucket no permite ACL, elimina esta línea y ajusta la política del bucket
  });

  await s3.send(command);

  const url = `https://${bucketName}.s3.${process.env.AMAZON_REGION}.amazonaws.com/${key}`;
  return { key, url };
}

// Función para eliminar imágenes
export async function deleteImage(key) {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  await s3.send(command);
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
    ACL: "public-read", 
    ContentType: "video/mp4", // Ajusta el Content-Type según el formato de video
  });

  await s3.send(command);

  return {
    key,
    url: `https://${bucketName}.s3.${process.env.AMAZON_REGION}.amazonaws.com/${key}`,
  };
}

export async function deleteVideo(key) {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await s3.send(command);

  return { key };
}
