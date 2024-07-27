import { Injectable, OnModuleInit } from '@nestjs/common';
import { OrderService } from '../order/order.service';
import { ContactService } from '../contact/contact.service';
import { FaqService } from '../faq/faq.service';
import { UserService } from '../user/user.service';
import { EventService } from '../event/event.service';
import * as TelegramBot from 'node-telegram-bot-api';
import { Order } from '../order/order.entity';
import { Contact } from '../contact/contact.entity';
import { FAQ } from '../faq/faq.entity';
import { Event } from '../event/event.entity';

@Injectable()
export class BotService implements OnModuleInit {
  private bot: TelegramBot;
  private adminId = '5379725422';

  constructor(
    private readonly orderService: OrderService,
    private readonly contactService: ContactService,
    private readonly faqService: FaqService,
    private readonly userService: UserService,
    private readonly eventService: EventService,
  ) {
    this.bot = new TelegramBot(
      '7181823098:AAEOnOvEhPSYyF3Pu6GnVN0PeO16qDQedbc',
      { polling: true },
    );
  }

  onModuleInit() {
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const menu = {
        reply_markup: {
          keyboard: [
            [{ text: '🛒 Сделать заказ' }],
            [{ text: '📞 Контакты' }, { text: '❓ Вопрос-Ответ' }],
            [{ text: '👤 Личный кабинет' }, { text: '📅 Календарь событий' }],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      };
      this.bot.sendMessage(chatId, '👋 *Привет! Чем я могу помочь?*', {
        parse_mode: 'Markdown',
        ...menu,
      });
    });

    this.bot.onText(/🛒 Сделать заказ/, (msg) => {
      this.bot.sendMessage(
        msg.chat.id,
        '📝 *Введите информацию для заказа в формате:* \n`имя, email, продукт, количество.`',
        { parse_mode: 'Markdown' },
      );
    });

    this.bot.onText(/📞 Контакты/, async (msg) => {
      const contacts = await this.contactService.findAll();
      const response = contacts
        .map((contact) => `🔹 *${contact.title}*: ${contact.value}`)
        .join('\n');
      this.bot.sendMessage(msg.chat.id, response || 'Контактов пока нет.', {
        parse_mode: 'Markdown',
      });
    });

    this.bot.onText(/❓ Вопрос-Ответ/, async (msg) => {
      const faqs = await this.faqService.findAll();
      const response = faqs
        .map((faq) => `❓ *${faq.question}*\n💬 ${faq.answer}`)
        .join('\n\n');
      this.bot.sendMessage(
        msg.chat.id,
        response || 'Нет часто задаваемых вопросов.',
        { parse_mode: 'Markdown' },
      );
    });

    this.bot.onText(/👤 Личный кабинет/, async (msg) => {
      const users = await this.userService.findAll();
      const user = users.find((u) => u.telegramId === msg.from.id.toString());
      if (user) {
        this.bot.sendMessage(
          msg.chat.id,
          `👤 *Ваш профиль:*\n\n*Имя:* ${user.name}\n*Email:* ${user.email}`,
          { parse_mode: 'Markdown' },
        );
      } else {
        this.bot.sendMessage(msg.chat.id, 'Профиль не найден.', {
          parse_mode: 'Markdown',
        });
      }
    });

    this.bot.onText(/📅 Календарь событий/, async (msg) => {
      const events = await this.eventService.findAll();
      const response = events
        .map(
          (event) =>
            `📅 *${event.title}*\n📝 ${event.description}\n📆 *Дата:* ${event.date}`,
        )
        .join('\n\n');
      this.bot.sendMessage(msg.chat.id, response || 'Нет ближайших событий.', {
        parse_mode: 'Markdown',
      });
    });

    this.bot.onText(/\/admin/, (msg) => {
      if (msg.from.id.toString() === this.adminId) {
        const adminMenu = {
          reply_markup: {
            keyboard: [
              [{ text: '➕ Добавить контакт' }],
              [{ text: '➕ Добавить вопрос' }],
              [{ text: '➕ Добавить событие' }],
              [{ text: '🔙 Назад' }],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        };
        this.bot.sendMessage(msg.chat.id, '🔐 *Админ-панель*', {
          parse_mode: 'Markdown',
          ...adminMenu,
        });
      } else {
        this.bot.sendMessage(
          msg.chat.id,
          '❌ У вас нет доступа к этой команде.',
          { parse_mode: 'Markdown' },
        );
      }
    });

    // Admin panel options
    this.bot.onText(/➕ Добавить контакт/, (msg) => {
      if (msg.from.id.toString() === this.adminId) {
        this.bot.sendMessage(
          msg.chat.id,
          'Введите контакт в формате: заголовок, значение.',
          { parse_mode: 'Markdown' },
        );
        this.bot.once('message', async (msg) => {
          const [title, value] = msg.text.split(', ');
          if (title && value) {
            const contact = new Contact();
            contact.title = title;
            contact.value = value;
            await this.contactService.create(contact);
            this.bot.sendMessage(msg.chat.id, '✅ Контакт добавлен.', {
              parse_mode: 'Markdown',
            });
          } else {
            this.bot.sendMessage(msg.chat.id, '❌ Неверный формат.', {
              parse_mode: 'Markdown',
            });
          }
        });
      }
    });

    this.bot.onText(/➕ Добавить вопрос/, (msg) => {
      if (msg.from.id.toString() === this.adminId) {
        this.bot.sendMessage(
          msg.chat.id,
          'Введите вопрос в формате: вопрос, ответ.',
          { parse_mode: 'Markdown' },
        );
        this.bot.once('message', async (msg) => {
          const [question, answer] = msg.text.split(', ');
          if (question && answer) {
            const faq = new FAQ();
            faq.question = question;
            faq.answer = answer;
            await this.faqService.create(faq);
            this.bot.sendMessage(msg.chat.id, '✅ Вопрос добавлен.', {
              parse_mode: 'Markdown',
            });
          } else {
            this.bot.sendMessage(msg.chat.id, '❌ Неверный формат.', {
              parse_mode: 'Markdown',
            });
          }
        });
      }
    });

    this.bot.onText(/➕ Добавить событие/, (msg) => {
      if (msg.from.id.toString() === this.adminId) {
        this.bot.sendMessage(
          msg.chat.id,
          'Введите событие в формате: заголовок, описание, дата.',
          { parse_mode: 'Markdown' },
        );
        this.bot.once('message', async (msg) => {
          const [title, description, date] = msg.text.split(', ');
          if (title && description && date) {
            const event = new Event();
            event.title = title;
            event.description = description;
            event.date = date;
            await this.eventService.create(event);
            this.bot.sendMessage(msg.chat.id, '✅ Событие добавлено.', {
              parse_mode: 'Markdown',
            });
          } else {
            this.bot.sendMessage(msg.chat.id, '❌ Неверный формат.', {
              parse_mode: 'Markdown',
            });
          }
        });
      }
    });

    this.bot.on('message', async (msg) => {
      if (msg.text.startsWith('/')) return;
      const text = msg.text;
      const [name, email, product] = text.split(', ');

      if (name && email && product) {
        const order = new Order();
        order.name = name;
        order.email = email;
        order.product = product;
        await this.orderService.create(order);
        this.bot.sendMessage(msg.chat.id, '✅ *Ваш заказ был принят.*', {
          parse_mode: 'Markdown',
        });
      }
    });
  }
}
