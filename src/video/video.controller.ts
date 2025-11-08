import {
  Controller,
  Get,
  Header,
  Res,
  Headers,
  HttpStatus,
} from '@nestjs/common';
import { statSync, createReadStream } from 'fs';
import { Response } from 'express';
import * as path from 'path';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY_CLOUDINARY,
  api_secret: process.env.API_SECRET,
});

@Controller('video')
export class VideoController {
  @Get('')
  @Header('Accept-Ranges', 'bytes')
  @Header('Content-Type', 'video/mp4')
  getVideoStream(@Headers() headers, @Res() res: Response) {
    const videoPath = path.resolve('1.mp4');
    const { size } = statSync(videoPath);
    const videoRange = headers.range;
    if (videoRange) {
      const parts = videoRange.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : size - 1;
      const chunksize = 10 ** 6;
      const readStreamfile = createReadStream(videoPath, {
        start,
        end,
        highWaterMark: 60,
      });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Content-Length': chunksize,
      };
      res.writeHead(HttpStatus.PARTIAL_CONTENT, head);
      readStreamfile.pipe(res);
    } else {
      const head = {
        'Content-Length': size,
      };
      res.writeHead(HttpStatus.OK, head);
      createReadStream(videoPath).pipe(res);
    }
  }

  @Get('video_v2')
  async videoCloudinary() {
    return await cloudinary.uploader.upload_large(path.resolve('1.mp4'), {
      resource_type: 'video',
      eager: [
        { width: 300, height: 300, crop: 'pad', audio_codec: 'none' },
        {
          width: 160,
          height: 100,
          crop: 'crop',
          gravity: 'south',
          audio_codec: 'none',
        },
      ],
      eager_async: true,
    });
  }
}
