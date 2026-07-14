import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Ctx, RequestContext, TransactionalConnection, TranslatorService } from '@vendure/core';
import { Province } from '@vendure/core/dist/entity/region/province.entity';
import { OrganizationAddress } from '../entities/organization-address.entity';

@Resolver('OrganizationAddress')
export class OrganizationAddressResolver {
    constructor(
        private connection: TransactionalConnection,
        private translatorService: TranslatorService,
    ) { }

    @ResolveField()
    async province(
        @Parent() organizationAddress: OrganizationAddress,
        @Ctx() ctx: RequestContext,
    ): Promise<Province | null> {
        if (!organizationAddress.id) {
            return null;
        }

        const address = await this.connection
            .getRepository(ctx, OrganizationAddress)
            .createQueryBuilder('address')
            .leftJoinAndSelect('address.province', 'province')
            .leftJoinAndSelect('province.translations', 'translation')
            .where('address.id = :id', { id: organizationAddress.id })
            .getOne();

        if (!address?.province) {
            return null;
        }

        return this.translatorService.translate(address.province, ctx);
    }
}
