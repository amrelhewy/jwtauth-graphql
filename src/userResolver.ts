import {Resolver, Query, Mutation, Arg, ObjectType, Field, Ctx, UseMiddleware, Int} from 'type-graphql'
import { User } from './entity/User'
import argon2 from 'argon2'
import { MyContext } from './MyContext'
import { createRefreshToken, createAccessToken } from './auth'
import { isAuth } from './isAuth'
import { sendRefreshToken } from './sendRefreshToken'
import { getConnection } from 'typeorm'
import { verify } from 'jsonwebtoken'
@ObjectType()
class LoginResponse{
    @Field(()=>String)
    accessToken:string
}
@Resolver()
export class UserResolver{
    @Query(()=>User,{nullable:true})
    async me(@Ctx() {req}:MyContext){
    const auth = req.headers['authorization'];
    if(!auth) return null;
    try{
        const token = auth.split(' ')[1]
        const payload:any = verify(token,process.env.ACCESS_TOKEN_SECRET!)
        return User.findOne(payload.userId)
    }
    catch{
        return null;
    }
    }
    
    @Query(()=>[User])
    async users(){
        return await User.find();
    }

    @Query(()=>String)
    @UseMiddleware(isAuth) //checks if auth
    bye(
        @Ctx(){payload}:MyContext
    ){
        return `ur user id is ${payload?.userId}`;
    }

 
    @Mutation(()=>Boolean)
    async register(
        @Arg('email',()=>String) email:string,
        @Arg('password') password:string
    ){
        const hashedPassword = await argon2.hash(password)
        try{
            await User.insert({
                email,
                password:hashedPassword
                }) 
                return true;
        }
        catch(err){
            console.log(err);
            return false
        }
     
    }
    @Mutation(()=>Boolean)
    async revokeRefreshTokenForUser(
        @Arg('userId',()=>Int) userId:number
    ){
    await getConnection().getRepository(User).increment({id:userId},'tokenVersion',1);
    return true
    }
    @Mutation(()=>LoginResponse)
    async login(
        @Arg('email',()=>String) email:string,
        @Arg('password') password:string
        @Ctx() {res}:MyContext
    ):Promise<LoginResponse>{
        const user = await User.findOne({where:{email}})
        if(!user){
            throw new Error('invalid login ')
        }
        const validPassword = await argon2.verify(user.password , password);
        if(!validPassword){
          throw new Error('wrong password')
        }

    
        //login successfull.
        //give them token to stay logged in.
        //the refresh token we store in a cookie.
        sendRefreshToken(res,createRefreshToken(user))

        return {
            accessToken:createAccessToken(user)
        }

  
     
    }
}