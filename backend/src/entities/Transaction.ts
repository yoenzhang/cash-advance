import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { User } from './User';
import { Application } from './Application';

export enum TransactionType {
    PAYMENT = 'PAYMENT',
    REFUND = 'REFUND',
    ADJUSTMENT = 'ADJUSTMENT'
}

export enum TransactionStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED'
}

@Entity('transactions')
export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('decimal', { precision: 10, scale: 2 })
    amount!: number;

    @Column({
        type: 'simple-enum',
        enum: TransactionType
    })
    type!: TransactionType;

    @Column({
        type: 'simple-enum',
        enum: TransactionStatus
    })
    status!: TransactionStatus;

    @Column({ nullable: true })
    description?: string;

    @Column({ nullable: true })
    reference?: string;

    @Column()
    userId!: string;

    @ManyToOne(() => User, (user) => user.transactions)
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column({ nullable: true })
    applicationId?: string;

    @ManyToOne(() => Application, (application) => application.transactions)
    @JoinColumn({ name: 'applicationId' })
    application!: Application;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
} 