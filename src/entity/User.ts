import {Entity, PrimaryGeneratedColumn, Column, BaseEntity} from "typeorm";
import { ObjectType, Field, Int } from "type-graphql";

@ObjectType()
@Entity("users")
export class User extends BaseEntity {

    @Field(()=>Int)
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @Column({unique:true})
    email: string;

    @Column()
    password: string;

    @Column("int",{default:0}) //whenever we create a refresh token we are going to pass what version the token is.[revoking a user if forgot password or got hacked]
    tokenVersion:number


}
