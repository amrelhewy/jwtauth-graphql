import "reflect-metadata";
import {createConnection} from "typeorm";
import express from 'express'
import {ApolloServer} from 'apollo-server-express'
import { buildSchema } from "type-graphql";
import { UserResolver } from "./userResolver";
import { MyContext } from "./MyContext";
import "dotenv/config"
import cookieParser from 'cookie-parser'
import { verify } from "jsonwebtoken";
import { User } from "./entity/User";
import { createAccessToken, createRefreshToken } from "./auth";
import cors from 'cors'
import { sendRefreshToken } from "./sendRefreshToken";
(async ()=>{
    const app  = express();
    app.use(cors(
      {
        origin:'http://localhost:3001',
        credentials:true
      }
    ))
    app.use(cookieParser())
    //special route in express to handle passing in refresh tokens to get a new access token after it expires ....
    app.post('/refresh_token',async (req,res)=>{
      const token = req.cookies.jid;
    if(!token){
      return res.send({ok:false,accessToken:""});
    }
    //validate refresh token
    let payload:any = null;
    try{
    payload=verify(token,process.env.REFRESH_TOKEN_SECRET!)
    }catch(err){
      return res.send({ok:false,accessToken:""});

    }
    //token is valid and we can send back and access token.
    const user = await User.findOne({id:payload.userId})
    if(!user){
      return res.send({ok:false,accessToken:""});

    }
    // check version of refresh token
    if(user.tokenVersion !== payload.tokenVersion){
      //if not same version that means the user sent a shitty version
      //the main way to invalidate the refresh token is to increment the token version
      return res.send({ok:false,accessToken:""});


    }
    //whenever they refresh the access token we refresh the refresh token too.
    sendRefreshToken(res,createRefreshToken(user))
    return res.send({ok:true,accessToken:createAccessToken(user)})

    
    })
    await createConnection();
    app.listen(4000,()=>console.log('server started..'));
    const apolloServer = new ApolloServer({
      schema: await buildSchema({
          resolvers:[UserResolver]
      }),
      context:({res,req}:MyContext)=>({res,req})
    })
   
    apolloServer.applyMiddleware({app,cors:false})

})();
