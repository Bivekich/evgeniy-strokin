import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderService } from './order/order.service';
import { ContactService } from './contact/contact.service';
import { FaqService } from './faq/faq.service';
import { UserService } from './user/user.service';
import { EventService } from './event/event.service';
import { Order } from './order/order.entity';
import { Contact } from './contact/contact.entity';
import { FAQ } from './faq/faq.entity';
import { User } from './user/user.entity';
import { Event } from './event/event.entity';
import { BotService } from './bot/bot.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'ep-icy-sea-a2d8yd9e.eu-central-1.aws.neon.tech',
      port: 5432,
      username: 'default',
      password: 'wliVz7xeZP2Q',
      database: 'verceldb',
      entities: [Order, Contact, FAQ, User, Event],
      synchronize: true,
      ssl: true,
    }),
    TypeOrmModule.forFeature([Order, Contact, FAQ, User, Event]),
  ],
  controllers: [],
  providers: [
    BotService,
    OrderService,
    ContactService,
    FaqService,
    UserService,
    EventService,
  ],
})
export class AppModule {}
