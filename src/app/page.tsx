"use client"
import { SignInButton,SignedOut} from '@clerk/nextjs';
import {SignedIn,SignOutButton} from "@clerk/nextjs";

import React from 'react'


function HomePage() {
  return (
    <main>
    <div> HomePage</div>
    <div>
      <SignedIn>
        <SignOutButton/>
      </SignedIn>
      <SignedOut>
        <SignInButton/>
      </SignedOut>
    </div>
    </main>
  )
}

export default HomePage;