import {
    DeepPartial,
    VendureEntity,
    Asset
} from '@vendure/core';
import { Column, Entity, ManyToOne, ManyToMany } from 'typeorm';
import { Organization } from './organization.entity';
@Entity()
export class OrganizationBranch extends VendureEntity {
    constructor(input?: DeepPartial<OrganizationBranch>) {
        super(input);
    }

    @Column('varchar', { length: 255, default: '' })
    name: string;

    @Column('varchar', { length: 255, default: '' })
    code: string;

    @Column({ default: false })
    isPrivate: boolean;

    @Column({ default: false })
    isRoot: boolean;

    @Column('text', { nullable: true })
    description: string | null;

    @Column({ default: true })
    enabled: boolean;

    @ManyToOne(() => Asset, { onDelete: 'SET NULL', eager: true })
    logo: Asset;

    @ManyToMany(() => Organization, organization => organization.branches)
    organizations: Organization[];
}
