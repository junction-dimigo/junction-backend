import fs from 'fs';
import path from 'path';
import { Inject, Service } from 'typedi';
import pinataSDK from '@pinata/sdk';
import config from '@src/config';
import Ipfs from '@src/models/ipfs';
import { Readable } from 'stream';

@Service()
export default class UploadService {
  constructor(
    @Inject('models.ipfs') private ipfsModel: typeof Ipfs,
    private pinata = pinataSDK(config.pinata.apiKey, config.pinata.secretKey),
  ) {}

  private randHex = (bytes: number) =>
    [...Array(bytes)]
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join('');

  public uploadImage = async (file: Express.Multer.File) => {
    const resp = await this.pinata.pinFileToIPFS(Readable.from(file.buffer));
    const extension = file.originalname.split('.').pop();
    const fileName = `${this.randHex(32)}.${extension}`;
    // fs.createWriteStream(path.join(__dirname, '../../files', fileName)).write(
    //   file.buffer,
    // );
    await this.ipfsModel.insertMany({
      originalFileName: file.originalname,
      fileName,
      hash: resp.IpfsHash,
    });

    return {
      originalFileName: file.originalname,
      fileName,
      url: `/files/${fileName}`,
      hash: resp.IpfsHash,
    };
  };
}
