// 接口文件
import type { MemberEntity } from '../model/member'

export const getMemberCollection = (): Promise<MemberEntity[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
       resolve([
          {
            id: 1457912,
            login: "brauliodiez",
            avatar_url: "https://avatars.githubusercontent.com/u/1457912?v=3"
          },
          {
            id: 4374977,
            login: "Nasdan",
            avatar_url: "https://avatars.githubusercontent.com/u/4374977?v=3"
          }
        ])
    }, 1000)
  })
}