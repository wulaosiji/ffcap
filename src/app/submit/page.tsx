import { redirect } from 'next/navigation'

/** Retired ranking-submission page. Readers continue in the on-site rankings library. */
export default function Submit() {
  redirect('/research/rankings')
}
