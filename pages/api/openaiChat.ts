// pages/api/openaiChat.ts
import type { NextApiRequest, NextApiResponse } from 'next';

import openai from '../../utils/openai';
import fs from 'fs';
import path from 'path';

export const systemPrompt = `You are a helpfull chatbot.'
You shoud help users to find information in text of lecture.
You should answer the questions with the information from part of lecture.
I'll give you a question and text of lecture.
`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { query, context, id } = req.body;

    // SSE 관련 헤더 설정
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const filePath = path.join(process.cwd(), 'public', 'txt', `${id}.txt`);
    const text = fs.readFileSync(filePath, 'utf-8');
    // JSON 형식의 문자열로 변환
    const jsonString = JSON.stringify({ text });
    console.log('jsonString: ', jsonString);

    try {
      const completionStream = await openai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `context: ${'test'}`,
          },
          {
            role: 'user',
            content: `query: ${query}`,
          },
        ],
        model: 'gpt-3.5-turbo',
        stream: true,
      });

      for await (const chunk of completionStream) {
        const text = chunk.choices[0].delta.content;
        console.log(`OpenAI chat response: ${text}`);
        if (text) {
          // 이벤트 스트리밍 형식으로 데이터 전송
          res.write(`data: ${JSON.stringify({ text: text })}\n\n`);
        }
      }

      res.end();
    } catch (error) {
      console.error('OpenAI chat error:', error);
      res.end();
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
