let cart = JSON.parse(localStorage.getItem("cart")) || [];

const cartContainer = document.getElementById("cartItemsContainer");

function loadCart() {

    cart = JSON.parse(localStorage.getItem("cart")) || [];

    cartContainer.innerHTML = "";

    if(cart.length === 0){

        cartContainer.innerHTML = `
            <h2 style="color:white">
                Your Cart is Empty
            </h2>
        `;

        updateTotal();
        return;
    }

    cart.forEach((item,index)=>{

        if(!item.quantity){
            item.quantity = 1;
        }

        cartContainer.innerHTML += `

        <div class="cart-item">

            <div class="cart-item-details">

                <h3 class="cart-item-name">
                    ${item.name}
                </h3>

                <p class="cart-item-price">
                    ₹${item.price}
                </p>

            </div>

            <div class="cart-item-controls">

                <button class="qty-btn"
                    onclick="changeQty(${index},-1)">
                    -
                </button>

                <span class="qty-display">
                    ${item.quantity}
                </span>

                <button class="qty-btn"
                    onclick="changeQty(${index},1)">
                    +
                </button>

                <button class="remove-btn"
                    onclick="removeItem(${index})">
                    Remove
                </button>

            </div>

        </div>

        `;
    });

    localStorage.setItem("cart",JSON.stringify(cart));

    updateTotal();

}

window.changeQty=function(index,value){

    cart[index].quantity += value;

    if(cart[index].quantity<=0){

        cart.splice(index,1);

    }

    localStorage.setItem("cart",JSON.stringify(cart));

    loadCart();

}

window.removeItem=function(index){

    cart.splice(index,1);

    localStorage.setItem("cart",JSON.stringify(cart));

    loadCart();

}

function updateTotal(){

    let subtotal=0;

    cart.forEach(item=>{

        subtotal += Number(item.price) * item.quantity;

    });

    const tax = subtotal*0.08;

    const total=subtotal+tax;

    document.querySelectorAll(".summary-line span")[1].innerText =
        "₹"+subtotal.toFixed(2);

    document.querySelectorAll(".summary-line span")[3].innerText =
        "₹"+tax.toFixed(2);

    document.querySelector(".summary-total span:last-child").innerText =
        "₹"+total.toFixed(2);

}

loadCart();