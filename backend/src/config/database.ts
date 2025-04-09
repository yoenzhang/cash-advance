import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Application } from '../entities/Application';
import { Transaction } from '../entities/Transaction';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'database.sqlite',
  synchronize: true,
  logging: true,
  entities: [User, Application, Transaction],
  subscribers: [],
  migrations: [],
}); 