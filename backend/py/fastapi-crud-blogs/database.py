# 向外输出 egine, Base  import export default ? 
# sql orm 工具 
from sqlalchemy import create_engine
# 用来当所有数据表模型类的父类，继承它就能变成 ORM 实体。
# 造出数据库会话对象
# 数据库会话，你增删改查都靠它跟数据库打交道。
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
# DeclarativeBase -> class 字段属性 -> orm 所有的能力 

DATABASE_URL = "sqlite:///./blog.db"  # 轻量文本关系型数据库 
# 创建数据库引擎
# echo 打印数据库语句 
# 用于调试， 上线后关闭 echo
# python 没有export default 语法 顶层变量自动导出
engine = create_engine(DATABASE_URL, echo=True)
# 事物 transaction 要不都成功， 要不回滚
# 手动控制刷新 用于新增后得到新的数据 autoflush 性能和安全
# autocommit 自动提交事务
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
# 继承 DeclarativeBase 类，就能变成 ORM 实体
class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        # yield 把会话交给FastAPI 路由使用， 函数在这里暂停
        yield db
    finally:
      # 请求处理完成， 不管成功还是报错， 都会执行， 关闭会话释放连接
        db.close()