import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FAQ } from './faq.entity';

@Injectable()
export class FaqService {
  constructor(
    @InjectRepository(FAQ)
    private faqsRepository: Repository<FAQ>,
  ) {}

  create(order: FAQ): Promise<FAQ> {
    return this.faqsRepository.save(order);
  }

  findAll(): Promise<FAQ[]> {
    return this.faqsRepository.find();
  }
}
