import { Args, Query, Resolver } from '@nestjs/graphql';
import { Ctx, RequestContext, ID, TransactionalConnection, TranslatorService } from '@vendure/core';
import { Permission } from '@vendure/common/lib/generated-types';
import { Allow } from '@vendure/core';
import { Province } from '@vendure/core/dist/entity/region/province.entity';

@Resolver()
export class ProvinceResolver {
    constructor(
        private connection: TransactionalConnection,
        private translatorService: TranslatorService,
    ) { }

    @Query()
    @Allow(Permission.Public)
    async provinces(
        @Ctx() ctx: RequestContext,
        @Args('options', { nullable: true }) options: any = {},
    ): Promise<any> {
        const qb = this.connection.getRepository(ctx, Province)
            .createQueryBuilder('province')
            .leftJoinAndSelect('province.translations', 'translation');

        if (options?.skip) qb.skip(options.skip);
        qb.take(options?.take ?? 100);

        const items = await qb.getMany();

        const translatedItems = items.map(item =>
            this.translatorService.translate(item, ctx)
        );

        return {
            items: translatedItems,
            totalItems: translatedItems.length
        };
    }

    @Query()
    @Allow(Permission.Public)
    async province(
        @Ctx() ctx: RequestContext,
        @Args('id') id: ID,
    ): Promise<Province | null> {
        const province = await this.connection.getRepository(ctx, Province)
            .createQueryBuilder('province')
            .where('province.id = :id', { id })
            .leftJoinAndSelect('province.translations', 'translation')
            .getOne();

        if (!province) return null;

        return this.translatorService.translate(province, ctx);
    }
}