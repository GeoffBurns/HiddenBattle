import OpenAI from "openai";
import dotenv from "dotenv";
import process from "process";

dotenv.config();

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
