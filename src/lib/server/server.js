//@ts-nocheck

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient()

//return all users
export async function get_users_db() {
    const allUsers = await prisma.user.findMany()
    return allUsers;
}

export async function get_all_likings_db(){
  const all_likings = await prisma.liking_list.findMany()

  return all_likings;
}

export async function get_all_users_keyword(){
  return await prisma.search_history.findMany()
}

export async function get_products_db(){
    const allProducts = await prisma.product.findMany()
    return allProducts;
  }

export async function get_transaction_db(){
  let all_paying_info = await prisma.paying_info.findMany();

  for(const paying of all_paying_info){
    let current_order = (await prisma.paying.findFirst({
      where:{
        payment_ID: paying.payment_ID
      }
    }));

   if(!current_order){
    continue;
   }
    
    let current_user_ID = (await prisma.orders.findFirst({
      where:{
        order_ID: current_order.order_ID
      }
    }));


    paying.user_ID = current_user_ID.user_ID;
    paying.status = current_user_ID.status;
  }

  return all_paying_info;
}

export async function get_certain_liking_db(user_ID_input,product_ID_input){
  return await prisma.liking_list.findUnique({
    where:{
      user_ID_product_ID:{
        user_ID:user_ID_input,
        product_ID:product_ID_input
      }
    }
  })
}

export async function get_all_cart_items_db(){
  return await prisma.cart_item.findMany()
}

export async function get_all_phone_numbers_db(){
  return await prisma.user_phone.findMany();
}

export async function get_certain_product_db(product_ID_input){
  return await prisma.product.findFirst({
    where:{
      product_ID:product_ID_input
    }
  })
}

export async function get_certain_user_cart_items(user_ID_input){
  return await prisma.cart_item.findMany({
    where:{
      cart_ID:user_ID_input
    }
  })
}


export async function get_certain_user_keyword(user_ID_input, keyword_input){
  return await prisma.search_history.findFirst({
    where:{
      user_ID:user_ID_input,
      keyword:keyword_input
    }
  })
}

//! Function
export async function create_new_user_db(account_input, password_input, address_input, email_input, birthdate_input, phone_number_input) {
  await prisma.user.create({
    data: {
      account: account_input,
      password: password_input,
      enrollment_date: (new Date(Date.now())).toISOString(),
      address: address_input,
      email_address: email_input,
      birthdate: birthdate_input
    }
  })

  let current_user_account_ID = 0;

  const allUsers = await get_users_db();
  for(const user of allUsers){
    if(user.account === account_input){
      current_user_account_ID = user.user_ID;
      break;
    }
  }

  await prisma.user_phone.create({
    data:{
      user_ID: current_user_account_ID,
      phone_number: phone_number_input
    }
  })
}

//this includes create paying info and paying two table
export async function create_new_paying_db(user_ID_input,bank_account_input,bank_num_input, delivering_address_input){
  
  let current_user_cart = await get_certain_user_cart_items(user_ID_input);
  let total_price_cal = 0;

  for(const item of current_user_cart){
    total_price_cal += Number(item.prices);
  }

  let current_user_order = await prisma.orders.findFirst({
    where:{
      user_ID:user_ID_input
    },
    orderBy:{
      order_ID: "desc"//it has a small defect, may discuss how to improve it --Akinom
    }
  });

  await prisma.paying_info.create({
    data:{
      bank_account:bank_account_input,
      bank_num: bank_num_input,
      delivering_address: delivering_address_input,
      total_price: total_price_cal,
      time_slot: (new Date(Date.now())).toISOString()
    }
  });

  let current_paying_info = await prisma.paying_info.findFirst({
    where:{
      bank_account: bank_account_input
    },
    orderBy:{
      payment_ID:"desc"
    }
  });

  await prisma.paying.create({
    data:{
      order_ID:current_user_order.order_ID,
      payment_ID: current_paying_info.payment_ID
    }
  })

  let current_user_account_ID = 0;

  const allUsers = await get_users_db();
  for(const user of allUsers){
    if(user.account === account_input){
      current_user_account_ID = user.user_ID;
      break;
    }
  }

  await prisma.user_phone.create({
    data:{
      user_ID: current_user_account_ID,
      phone_number: phone_number_input
    }
  })
}


//following content is for place an order, including create order_item and orders
export async function create_new_order_db(user_ID_input){
  await prisma.orders.create({
    data:{
      user_ID:user_ID_input,
      status:1
    }
  });

  let all_cart_items = await get_certain_user_cart_items_db(user_ID_input);
  let current_user_order = await prisma.orders.findFirst({
    where:{
      user_ID:user_ID_input
    },
    orderBy:{
      order_ID: "desc"//it has a small defect, may discuss how to improve it --Akinom
    }
  });

  
  for(const item of all_cart_items){
      await prisma.order_item.create({
        data:{
          order_ID:current_user_order.order_ID,
          product_ID:item.product_ID,
          quantity:item.quantity,
          prices:item.prices
      }
    })
  }
}

export async function create_liking_item_db(user_ID_input, product_ID_input){
  await prisma.liking_list.create({
    data:{
        user_ID:user_ID_input,
        product_ID: product_ID_input
    }
  })
}


export async function create_new_keyword(user_ID_input,keyword_input){
  await prisma.search_history.create({
    data:{
      user_ID:user_ID_input,
      keyword:keyword_input
    }
  })
}

//update users
//there's a better way to do this but I will hold for it -- Akinom
export async function update_a_user_db(user_account, password_input, address_input, email_address_input, birthdate_input){
  await prisma.user.update({
    where: {
      account: user_account
    },
    data: {
      password: password_input,
      address: address_input,
      email_address: email_address_input,
      birthdate: birthdate_input
    }
  })
}

export async function update_user_cart_db(user_ID,product_ID_input,quantity_input,price_input){
  await prisma.cart_item.update({
    where:{
      cart_ID_product_ID:{
        cart_ID: user_ID,
        product_ID: product_ID_input
      }
    },
    data:{
      quantity: quantity_input,
      prices: price_input
    }
  })
}


export async function update_product_review_db(product_ID_input,review){
  let current_product = await get_certain_product_db(product_ID_input);

  let final_review = (current_product.avg_score * current_product.num_of_comment + review) / (current_product.num_of_comment + 1);

  await prisma.product.update({
    where:{
      product_ID:product_ID_input
    },
    data:{
      num_of_comment: Number(current_product.num_of_comment) + 1,
      avg_score: final_review
    }
  })
}

export async function update_product_liking_db(product_ID_input, like){
  let current_product = await get_certain_product_db(product_ID_input);

  await prisma.product.update({
    where:{
      product_ID:product_ID_input
    },
    data:{
      likes: current_product.likes + like
    }
  })
}

//find certain cart item using ID
export async function check_cart_item_db(user_ID,product_ID_input){
  return await prisma.cart_item.findFirst({
    where:{
      cart_ID: user_ID,
      product_ID: product_ID_input,
    }
  })
}


//update or create cart item
export async function add_to_cart_db(user_ID,product_ID_input,quantity_input,price_input){
  let tmp_cart_item = await check_cart_item_db(user_ID,product_ID_input);

  if(tmp_cart_item){
      let origin_quantity = tmp_cart_item?.quantity;
      let origin_price = tmp_cart_item?.prices;
      await prisma.cart_item.update({
      where: {
        cart_ID_product_ID:{
          cart_ID:user_ID,
          product_ID:product_ID_input
        }
      },
      data: {
        quantity: Number(origin_quantity) + Number(quantity_input),
        prices: Number(origin_price) + Number(price_input)
      }
    })
  }else{
    await prisma.cart_item.create({
      data:{
        cart_ID:user_ID,
        product_ID:product_ID_input,
        quantity: quantity_input,
        prices: price_input
      }
    })
  }
}
//TODO update products


//delete a user account
export async function delete_a_user_db(current_user_ID){

  await prisma.user.delete({
    where: {
      user_ID: current_user_ID
    }
  });

  
  await prisma.user_phone.deleteMany({
    where: {
      user_ID: current_user_ID,
    }
  })

  await prisma.liking_list.deleteMany({
    where: {
      user_ID: current_user_ID
    }
  })

  await prisma.cart_item.deleteMany({
      where: {
        cart_ID: current_user_ID
      }
  })
}

export async function delete_a_cart_item_db(user_ID,product_ID_input){
  await prisma.cart_item.delete({
    where:{
      cart_ID_product_ID:{
        cart_ID:user_ID,
        product_ID: product_ID_input
      }
    }
  })
}


export async function modify_product_after_order_db(user_ID_input){
  let user_cart_items = get_certain_user_cart_items(user_ID_input);

  for(const item of user_cart_items){
    let current_product = get_certain_product_db(item.product_ID)
    await prisma.product.update({
      where:{
        product_ID: current_product.product_ID
      },
      data:{
        stock: current_product.stock - item.quantity,
        sales: current_product.sales + item.quantity
      }
    })
  }

}


// different from previous one,it will delete everything
// that user gives review
export async function delete_cart_items_db(user_ID_input){
  await prisma.cart_item.deleteMany({
    where:{
      cart_ID:user_ID_input
    }
  })
}

export async function delete_liking_item_db(user_ID_input, product_ID_input){
  await prisma.liking_list.delete({
    where:{
      user_ID_product_ID:{
        user_ID:user_ID_input,
        product_ID: product_ID_input
      }
    }
  })
}


export async function modify_product_after_order_db(user_ID_input){
  let user_cart_items = await get_certain_user_cart_items_db(user_ID_input);

  for(const item of user_cart_items){
    let current_product = await get_certain_product_db(item.product_ID)
    await prisma.product.update({
      where:{
        product_ID: current_product.product_ID
      },
      data:{
        stock: current_product.stock - item.quantity,
        sales: current_product.sales + item.quantity
      }
    })
  }
}