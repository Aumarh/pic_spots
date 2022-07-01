import { css } from '@emotion/react';
import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import Layout from '../../components/Layout';
import { getUserByValidSessionToken, User } from '../../util/database';

const appNameStyles = css`
  font-family: 'Allura', cursive;
  font-size: 2.5rem;
  font-weight: bold;
  text-align: center;
`;

type Props = { user: User };

export default function PrivateProfile(props: Props) {
  // if (!props.user) {
  //   return (
  //     <>
  //       <Head>
  //         <title>User not found</title>
  //         <meta name="description" content="User not found" />
  //       </Head>
  //       <h1>404 - User not found</h1>
  //       Better luck next time
  //     </>
  //   );
  // }

  return (
    <div>
      <Head>
        <title>{props.user.username}</title>
        <meta
          name="description"
          content="Pic Spot is an web app that helps folks new to Vienna find picture perfect spots around Vienna"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layout>
        <main>
          <h1 css={appNameStyles}>@{props.user.username}</h1>

          <div>username: {props.user.username}</div>
          <div>bio: {props.user.bio}</div>
        </main>
      </Layout>
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const user = await getUserByValidSessionToken(
    context.req.cookies.sessionToken,
  );

  if (user) {
    return {
      props: {
        user: user,
      },
    };
  }

  return {
    redirect: {
      destination: '/login?returnTo=/users/private-profile',
      permanent: false,
    },
  };
}
