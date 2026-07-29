import * as React from 'react';
interface Props{
    userName:string
}
// type Props = {
    // username:string
// }
const Hello:React.FC<Props>=(props) => {
    return (
        <h2>Hello {props.userName}</h2>
    )
}

export default Hello