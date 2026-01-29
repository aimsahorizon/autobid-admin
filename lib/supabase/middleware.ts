import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  try {
    let supabaseResponse = NextResponse.next({
      request,
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase environment variables are missing in middleware!')
      return supabaseResponse
    }

    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              request.cookies.set({
                name,
                value,
                ...options,
              })
            )
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set({
                name,
                value,
                ...options,
              })
            )
          },
        },
      }
    )

    // IMPORTANT: Avoid writing to the database in middleware
    const { data, error } = await supabase.auth.getUser()

    if (error) {
      // If there's an auth error (e.g. invalid token), we just continue as logged out
      // console.error('Auth error in middleware:', error)
    }

    const user = data?.user

    // If no user and trying to access admin routes, redirect to login
    if (
      !user &&
      !request.nextUrl.pathname.startsWith('/login') &&
      request.nextUrl.pathname !== '/'
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // Redirect logged in users from login page to admin
    if (user && request.nextUrl.pathname === '/login') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (e) {
    console.error('Middleware error:', e)
    // Return original response on error to avoid breaking the app completely
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }
}
