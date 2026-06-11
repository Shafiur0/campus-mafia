import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      avatar: string | null;
      isGuest: boolean;
    };
    socketToken?: string;
  }
}
