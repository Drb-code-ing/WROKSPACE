// jev 的开源平替
import { Laya } from "laya-system-one"

async function run() {
  // 300+ MB
  // 首次运行会自动下载模型
  const laya = await Laya.load()

  const state = {
    msg: "账号登录失败，提示权限不足"
  }

  const question = {
    category: {
      type: "choice",
      instructions: "这条消息属于哪一类问题？",
      criteria: {
        auth: "权限、登录、账号认证",
        bug: "功能报错、程序异常",
        billing: "扣费、账单问题"
      }
    },
    isUrgent: {
      type: "noul",
      instructions: "这条消息是否需要紧急处理？",
      threshold: 0.5 // 0.5 以上为紧急
    }
  }

  const result = await laya.predict(state, question)
  console.log('===推理结果===')
  console.log('分类', result.answers.category.choice)
  console.log('分布概率', result.answers.category.probabilities)
  console.log('是否紧急', result.answers.isUrgent.decision)
  console.log('紧急概率', result.answers.isUrgent.noul)
}

run()
  .catch(console.error)