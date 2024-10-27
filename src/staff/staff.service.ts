import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateStaffDto } from './dto/create-stuff.dto';
import { UpdateStaffDto } from '../auth/dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StaffService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(createStaffDto: CreateStaffDto) {
    const candidate = await this.prismaService.staff.findUnique({
      where: {
        login: createStaffDto.login,
      },
    });

    if (candidate) {
      throw new BadRequestException('Email already exists');
    }

    const role = await this.prismaService.role.findUnique({
      where: { name: createStaffDto.role },
    });

    if (!role) {
      throw new NotFoundException('Role does not exist');
    }

    if (createStaffDto.password !== createStaffDto.confirm_password) {
      throw new BadRequestException('Password does not match');
    }
    const hashedPassword = await bcrypt.hash(createStaffDto.password, 10);

    const newStaff = await this.prismaService.staff.create({
      data: {
        first_name: createStaffDto.first_name,
        last_name: createStaffDto.last_name,
        phone_number: createStaffDto.phone_number,
        login: createStaffDto.login,
        hashedPassword,
        roles: {
          create: [{roleId: role.id}]
        }
      },
    });

    return newStaff;
  }

  async findAll() {
    const roles = await this.prismaService.role.findMany({
      include: { staffs: { include: { staff: true } } }
    });
    return roles;
  }
  

  findOne(id: number) {
    return `This action returns a #${id} staff`;
  }

  update(id: number, updateStaffDto: UpdateStaffDto) {
    return `This action updates a #${id} staff`;
  }

  async remove(id: number) {
    // StaffRole bo'yicha bog'langan yozuvlarni o'chirish
    await this.prismaService.staffRole.deleteMany({
      where: { staffId: id },
    });
  
    // Keyin staff ni o'chirish
    const deletedStaff = await this.prismaService.staff.delete({
      where: { id },
    });
  
    return deletedStaff;
  }
  
}
