import { AbstractModel } from './abstract.model';
import {
	FilterQuery,
	Model,
	QueryOptions,
	Types,
	UpdateQuery,
	UpdateWithAggregationPipeline,
	UpdateWriteOpResult,
} from 'mongoose';
import { MongoError } from 'mongodb';
import { ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';

export abstract class AbstractService<T extends AbstractModel> {
	protected constructor(private model: Model<T>) {}

	protected abstract modelName;

	getModelName(): string {
		return this.modelName.toUpperCase();
	}

	async findOne(filterQuery: FilterQuery<T>, projection?: any | null): Promise<T> {
		try {
			return await this.model.findOne(filterQuery, projection);
		} catch (e) {
			throw new InternalServerErrorException(e);
		}
	}

	async findById(id: Types.ObjectId, populate?: string[]): Promise<T> {
		let data;
		try {
			const query = this.model.findById(id);
			populate?.forEach((arg) => {
				query.populate(arg);
			});
			const result = await query;
			data = result.toObject();
		} catch (e) {
			throw new InternalServerErrorException(e.message);
		}
		if (!data) {
			throw new NotFoundException(`Could not find ${this.modelName} because the given id (${id}) doesn't match any.`);
		}

		return data;
	}

	async find(filterQuery: FilterQuery<T>, projection?: any | null, options?: QueryOptions | null): Promise<T[]> {
		const data = [];
		try {
			const query = this.model.find(filterQuery, projection, options);
			const result = await query;
			result.map((res) => data.push(res.toObject()));
		} catch (e) {
			throw new InternalServerErrorException(e.message);
		}

		return data;
	}

	async create(model: any): Promise<T> {
		try {
			return await this.model.create(model);
		} catch (e) {
			if ((e as MongoError) && e.code === 11000) {
				throw new ConflictException(
					`The provided data for ${this.modelName} triggered a duplicate error. Probably, this model has an extra unique field other its id.`,
				);
			}
			throw new InternalServerErrorException(e.message);
		}
	}

	async findByIdAndUpdate(id: Types.ObjectId, updateQuery: UpdateQuery<T>): Promise<T> {
		let data;
		try {
			data = await this.model.findByIdAndUpdate(id, updateQuery, {
				new: true,
			});
		} catch (e) {
			if ((e as MongoError) && e.code === 11000) {
				throw new ConflictException(
					`The provided data for ${this.modelName} triggered a duplicate error. Probably, this model has an extra unique field other its id.`,
				);
			}
			throw new InternalServerErrorException(e.message);
		}
		if (!data) {
			throw new NotFoundException(`Could not update ${this.modelName} because the given id (${id}) doesn't match any.`);
		}

		return data;
	}

	async findOneAndUpdate(
		filterQuery: FilterQuery<T>,
		updateQuery: UpdateQuery<T>,
		options: QueryOptions & { new: true } = { new: true },
	): Promise<T> {
		let data;
		try {
			data = await this.model.findOneAndUpdate(filterQuery, updateQuery, options);
		} catch (e) {
			if ((e as MongoError) && e.code === 11000) {
				throw new ConflictException(
					`The provided data for ${this.modelName} triggered a duplicate error. Probably, this model has an extra unique field other its id.`,
				);
			}
			throw new InternalServerErrorException(e.message);
		}
		if (!data) {
			throw new NotFoundException(
				`Could not update ${this.modelName} because the given body (${filterQuery}) doesn't match any.`,
			);
		}

		return data as T;
	}

	async updateOne(
		filter?: FilterQuery<T>,
		update?: UpdateQuery<T> | UpdateWithAggregationPipeline,
		options?: QueryOptions | null,
	): Promise<UpdateWriteOpResult> {
		try {
			return await this.model.updateOne(filter, update, options);
		} catch (e) {
			if ((e as MongoError) && e.code === 11000) {
				throw new ConflictException(
					`The provided data for ${this.modelName} triggered a duplicate error. Probably, this model has an extra unique field other its id.`,
				);
			}
			throw new InternalServerErrorException(e.message);
		}
	}

	async updateMany(
		filter?: FilterQuery<T>,
		update?: UpdateQuery<T> | UpdateWithAggregationPipeline,
		options?: QueryOptions | null,
	): Promise<UpdateWriteOpResult> {
		try {
			return await this.model.updateMany(filter, update, options);
		} catch (e) {
			if ((e as MongoError) && e.code === 11000) {
				throw new ConflictException(
					`The provided data for ${this.modelName} triggered a duplicate error. Probably, this model has an extra unique field other its id.`,
				);
			}
			throw new InternalServerErrorException(e.message);
		}
	}

	async findByIdAndDelete(id: Types.ObjectId): Promise<T> {
		let data;
		try {
			data = await this.model.findByIdAndDelete(id);
		} catch (e) {
			throw new InternalServerErrorException(e.message);
		}
		if (!data) {
			throw new NotFoundException(`Could not delete ${this.modelName} because the given id (${id}) doesn't match any.`);
		}

		return data;
	}

	async findOneAndDelete(filterQuery: FilterQuery<T>): Promise<T> {
		let data;
		try {
			data = await this.model.findOneAndDelete(filterQuery);
		} catch (e) {
			throw new InternalServerErrorException(e.message);
		}
		if (!data) {
			throw new NotFoundException(
				`Could not delete ${this.modelName} because the given body (${filterQuery}) doesn't match any.`,
			);
		}

		return data;
	}

	async deleteOne(filter?: FilterQuery<T>, options?: QueryOptions): Promise<any> {
		try {
			return await this.model.deleteOne(filter, options);
		} catch (e) {
			throw new InternalServerErrorException(e.message);
		}
	}

	async deleteMany(filter?: FilterQuery<T>, options?: QueryOptions): Promise<any> {
		try {
			return await this.model.deleteMany(filter, options);
		} catch (e) {
			throw new InternalServerErrorException(e.message);
		}
	}
}
