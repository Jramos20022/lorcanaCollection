import { gql } from "@apollo/client";

export const LOGIN_USER = gql`
  mutation login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        _id
        username
      }
    }
  }
`;

export const ADD_USER = gql`
  mutation addUser($username: String!, $email: String!, $password: String!) {
    addUser(username: $username, email: $email, password: $password) {
      token
      user {
        _id
        username
      }
    }
  }
`;

export const ADD_DECK = gql`
  mutation addDeck($deckName: String!, $cards: [CardInput]) {
    addDeck(deckName: $deckName, cards: $cards) {
      _id
      deckName
      user_id
      cards {
        _id
        image
        artist
        set_name
        classifications
        abilities
        set_num
        color
        franchise
        image
        cost
        inkable
        type
        lore
        rarity
        flavor_text
        unique_id
        card_num
        body_text
        willpower
        card_variants
        strength
        set_id
        count
      }
    }
  }
`;

export const ADD_CARD = gql`
  mutation addCard($deckId: ID!, $image: String!) {
    addCard(deckId: $deckId, image: $image) {
      _id
      cards {
        _id
        image
      }
      deckName
    }
  }
`;

export const REMOVE_DECK = gql`
  mutation removeDeck($deckId: ID!) {
    removeDeck(deckId: $deckId) {
      _id
    }
  }
`;

export const REMOVE_CARD = gql`
  mutation removeCard($removeCardDeckId2: ID!, $cardId: ID!) {
    removeCard(deckId: $removeCardDeckId2, cardId: $cardId) {
      _id
    }
  }
`;

export const UPDATE_DECK = gql`
  mutation updateDeck($deckId: ID!, $deckName: String, $cards: [CardInput]) {
    updateDeck(deckId: $deckId, deckName: $deckName, cards: $cards) {
      _id
      deckName
      cards {
        image
        name
        type
        card_num
        count
      }
    }
  }
`;

export const UPDATE_COLLECTION_CARD = gql`
  mutation UpdateCollectionCard($card: CardInput!, $printing: String!, $quantity: Int!) {
    updateCollectionCard(card: $card, printing: $printing, quantity: $quantity) {
      unique_id
      count
      standard_count
      foil_count
    }
  }
`;

export const ADD_COLLECTION_CARD = gql`
  mutation AddCollectionCard($card: CardInput!, $printing: String!) {
    addCollectionCard(card: $card, printing: $printing) {
      unique_id
      count
      standard_count
      foil_count
    }
  }
`;

export const REMOVE_COLLECTION_CARD = gql`
  mutation RemoveCollectionCard($uniqueId: String!) {
    removeCollectionCard(uniqueId: $uniqueId) {
      unique_id
      count
      standard_count
      foil_count
    }
  }
`;
