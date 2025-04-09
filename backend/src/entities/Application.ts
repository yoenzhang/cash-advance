import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './User';
import { Transaction } from './Transaction';

export enum ApplicationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DISBURSED = 'DISBURSED',
  REPAID = 'REPAID',
  CANCELLED = 'CANCELLED'
}

@Entity('applications')
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column('decimal', { precision: 10, scale: 2 })
  amount!: number;

  @Column()
  purpose!: string;

  @Column({
    type: 'simple-enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.PENDING
  })
  status!: ApplicationStatus;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  disbursedAmount?: number;

  @Column({ nullable: true })
  disbursementDate?: Date;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  repaidAmount?: number;

  @Column({ nullable: true })
  repaymentDate?: Date;

  @Column({ nullable: true })
  rejectionReason?: string;

  @Column({ nullable: true })
  approvedBy?: string;

  @Column({ nullable: true })
  approvedAt?: Date;

  @OneToMany(() => Transaction, transaction => transaction.application)
  transactions!: Transaction[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ nullable: true, default: false })
  expressDelivery?: boolean;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, default: 0 })
  tip?: number;
} 