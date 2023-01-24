import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm/dist';
import { response } from 'express';
import { NotFoundError } from 'rxjs';
import { Repository } from 'typeorm';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Course } from './entities/course.entity';
import { Tag } from './entities/tag.entity';

@Injectable()
export class CoursesService {
 constructor(
  @InjectRepository(Course)
  private readonly courseRepository: Repository<Course>,
  @InjectRepository(Tag)
  private readonly tagRepository: Repository<Tag>,
  ){}
  async create(createCourseDto: CreateCourseDto) {
    const tags = await Promise.all(
      createCourseDto.tags.map((name) => this.preloadTagByName(name))
    );
    const courses = this.courseRepository.create({
      ...createCourseDto,
      tags,
    });
    return this.courseRepository.save(courses);
  }

  findAll() {
    return this.courseRepository.find({
      relations: ['tags'],
    });
  }

  findOne(id: string) {
    const courses = this.courseRepository.findOne({where:{id: +id}, relations: ['tags']});
    if(!courses){
      throw new NotFoundException(
        `Course Id ${id} was not found.`
      );
    }
    else{
      return courses;
    }
  }

  async update(id: string, updateCourseDto: UpdateCourseDto) {
    const tags = updateCourseDto.tags && (
      await Promise.all(
        updateCourseDto.tags.map((name) => this.preloadTagByName(name)),
      ));
    const courses = await this.courseRepository.preload({
      id: +id,
      ...updateCourseDto,
      tags,
    });
    if(!courses){
      throw new NotFoundException(`Course Id ${id} was not found.`);
    }
    else{
      return this.courseRepository.save(courses);
    }
  }

  async remove(id: string) {
    const courses = await this.courseRepository.findOne({where:{id: +id}})
    if(!courses){
      throw new NotFoundException(`Course Id ${id} was not found.`);
    }
    else{
      return this.courseRepository.remove(courses);
    }
  }
  private async preloadTagByName(name: string): Promise<Tag>{
    const tag = await this.tagRepository.findOne({where:{name}});
    if(tag){
      return tag;
    }
    else{
      return this.tagRepository.create({name});
    }
  }
}
