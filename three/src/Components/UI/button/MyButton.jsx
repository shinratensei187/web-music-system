import React from "react";
import classes from './MyButton.module.css'; //Добавляем стили сss

const MyButton = ({children, ...props}) => {
    return(
        <button {...props} className={classes.myBtn}>
            {children}  {/* {Указываем React куда добавлять вложеный эллемент  */}
        </button>
    );
};

export default MyButton;