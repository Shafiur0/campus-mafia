import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@campus-mafia/db';
import jwt from 'jsonwebtoken';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'dummy-google-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-google-client-secret',
    }),
    CredentialsProvider({
      name: 'Guest Login',
      credentials: {
        name: { label: 'Name', type: 'text', placeholder: 'Enter nickname' }
      },
      async authorize(credentials) {
        if (!credentials?.name) return null;
        
        // Create a new guest user in database
        const guestUser = await prisma.user.create({
          data: {
            name: credentials.name,
            isGuest: true
          }
        });
        
        // Initialize stats record
        await prisma.userStats.create({
          data: {
            userId: guestUser.id
          }
        });

        return {
          id: guestUser.id,
          name: guestUser.name,
          email: null,
          image: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(guestUser.name)}`
        };
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const email = user.email!;
        let dbUser = await prisma.user.findUnique({ where: { email } });
        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              name: user.name || 'Student Player',
              email,
              avatar: user.image,
              isGuest: false
            }
          });
          
          await prisma.userStats.create({
            data: {
              userId: dbUser.id
            }
          });
        }
        user.id = dbUser.id;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.avatar = user.image;
        token.isGuest = (user.email === null || user.email === undefined);
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id as string,
          name: token.name as string,
          avatar: token.avatar as string | null,
          isGuest: token.isGuest as boolean
        };
        
        const jwtSecret = process.env.NEXTAUTH_SECRET || 'fallback-secret-for-dev';
        session.socketToken = jwt.sign(
          {
            id: token.id,
            name: token.name,
            avatar: token.avatar
          },
          jwtSecret
        );
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt'
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-dev'
};
