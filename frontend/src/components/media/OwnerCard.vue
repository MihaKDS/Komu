<script setup>
defineProps({

    copy:Object

});
</script>

<template>

    <div class="owner-card">

        <div class="owner-header">

            <div class="owner-avatar">
                👤
            </div>

            <div class="owner-info">

                <h4>{{ copy.user.username }}</h4>

                <p>{{ copy.user.city }}</p>

            </div>

        </div>

        <div class="owner-options">

            <div
                v-if="copy.canRent"
                class="option"
            >

                <h5>Rent</h5>

                <p><strong>Price:</strong> {{ copy.rentPrice }} €</p>

                <p><strong>Deposit:</strong> {{ copy.sellPrice }} €</p>

                <button>
                    Borrow
                </button>

            </div>

            <div
                v-if="copy.canSell"
                class="option"
            >

                <h5>Buy</h5>

                <p><strong>Price:</strong> {{ copy.sellPrice }} €</p>

                <button>
                    Buy
                </button>

            </div>

        </div>

    </div>

</template>

<style scoped>

.owner-card{

    background:#2a2a2a;

    border:1px solid #444;

    border-radius:12px;

    padding:1rem;

    margin-bottom:1rem;

}

.owner-header{

    display:flex;

    gap:1rem;

    align-items:center;

    margin-bottom:1rem;

}

.owner-avatar{

    width:50px;
    height:50px;

    border-radius:50%;

    background:#444;

    display:flex;

    align-items:center;

    justify-content:center;

    font-size:1.5rem;

}

.owner-info h4{

    margin:0;

    color:white;

}

.owner-info p{

    margin:.25rem 0 0;

    color:#999;

}

.owner-options{

    display:flex;

    gap:2rem;

}

.option{

    flex:1;

    background:#1d1d1d;

    border-radius:8px;

    padding:1rem;

}

.option h5{

    margin-top:0;

    color:white;

}

.option p{

    color:#bbb;

    margin:.4rem 0;

}

.option button{

    margin-top:1rem;

    width:100%;

    padding:.7rem;

    border:none;

    border-radius:6px;

    cursor:pointer;

    background:#4f8cff;

    color:white;

    font-weight:600;

}

.option button:hover{

    background:#3c78dc;

}

</style>