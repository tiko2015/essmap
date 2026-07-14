import {
    DeepPartial,
    VendureEntity,
    Country,
} from '@vendure/core';
import { Province } from '@vendure/core/dist/entity/region/province.entity';
import { Column, Entity, ManyToOne, Index } from 'typeorm';
import { Point } from 'geojson';

import { Organization } from './organization.entity';
@Entity()
export class OrganizationAddress extends VendureEntity {
    constructor(input?: DeepPartial<OrganizationAddress>) {
        super(input);
    }

    @ManyToOne(() => Organization, (organization) => organization.addresses)
    organization: Organization;

    @Column({ default: '' }) fullName: string;

    @Column() streetLine1: string;

    @Column({ default: '' }) streetLine2: string;

    @Column({ default: '' }) city: string;

    @Column({ default: '' }) postalCode: string;

    @Index()
    @ManyToOne(() => Country)
    country: Country;

    @Index()
    @ManyToOne(() => Province)
    province: Province;

    @Column({ default: '' }) phoneNumber: string;

    @Index({ spatial: true })
    @Column({
        type: 'geography',
        spatialFeatureType: 'Point',
        srid: 4326,
        nullable: true,
    })
    location: Point | null

}
