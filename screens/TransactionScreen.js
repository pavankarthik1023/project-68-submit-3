import React from 'react';
import {Text,View,TouchableOpacity,StyleSheet,Image,TextInput,KeyboardAvoidingView,Alert}  from 'react-native';
import * as Permissions from 'expo-permissions';
import {BarCodeScanner} from 'expo-barcode-scanner';
import  firebase from 'firebase';
import db from '../config';


export default class TransactionScreen extends React.Component
{
    constructor(){
        super();
        this.state={
            hasCameraPermission:null,
            scanned:false,
            scannedData:'',
            buttonState:'normal',
            scannedBookId:'',
            scannedStudentId:'',
            transactionMessage:''
        }
        
    }

    handleTransaction =async ()=>{
        var transactionType=await this.checkBookEligibility();
        if(! transactionType){
            Alert.alert("this book deoesn't exist");
            this.setState({
                scannedStudentId:'',
                scannedbookId:'',
            })
        }
        else if(transactionType==="Issue"){
            var isStudentEligible= await this.checkStudentEligibilityForBookIssue();
            if(isStudentEligible){
                this.initiateBookIssue();
                Alert.alert("Book Issued");
            }

        }
         else{
            var isStudentEligible= await this.checkStudentEligibilityForBookReturn();
            if(isStudentEligible){
                this.initiateBookReturn();
                Alert.alert("Book Returned");
            } 
         }

        
    }

    initiateBookIssue = async()=>{
        //add a transaction
        db.collection("transaction").add({
          'studentId': this.state.scannedStudentId,
          'bookId' : this.state.scannedBookId,
          'date' : firebase.firestore.Timestamp.now().toDate(),
          'transactionType': "Issue"
        })
        //change book status
        db.collection("books").doc(this.state.scannedBookId).update({
          'bookAvailability': false
        })
        //change number  of issued books for student
        db.collection("students").doc(this.state.scannedStudentId).update({
          'numberOfBooksIssued': firebase.firestore.FieldValue.increment(1)
        })
      }

    initiateBookReturn=async()=>{
        //add a transaction
        db.collection("transaction").add({
        'studentId':this.state.scannedStudentId,
        'bookId':this.state.scannedbookId,
        'date':firebase.firestore.Timestamp.now().toDate(),
        'transactionType':"Return",

        })
        //change book status
        db.collection("books").doc(this.state.scannedBookId).update({
        'bookAvailability':true,

        })
        // change number of issued bookfor student
        db.collection("student").doc(this.state.scannedStudentId).update({
            'numberOfBooksIssued':firebase.firestore.fieldValue.increement(-1)

        })
        this.setState({
            scannedBookId:'',
            scannedStudentId:''
        })
    }

    getCameraPermission=async (id)=>{
        const { status}=await Permissions.askAsync(Permissions.CAMERA)  ;
        this.setState({
            hasCameraPermission:status==="granted",
            buttonState:id,
            sacnned:false,

        })
    }
    handleBarCodeScanned=async({type,data })=>{
        const{buttonState}=this.state
        if(buttonState==="bookId")
        {
            this.setState({
                scanned:true,
                scannedbookId:data,
                buttonState:'normal',
            })
        }
         else if(buttonState==="studentId")
        {
            this.setState({
                scanned:true,
                scannedstudentId:data,
                buttonState:'normal',
            })
        }
        
      
    }
   
    render(){
        const hasCameraPermission=this.state.hasCameraPermission;
        const scanned  =this.state.scanned;
        const buttonState= this.state.buttonState;
        if(buttonState!=="normal" && hasCameraPermission){
            return(
            <BarCodeScanner onBarCodeScanned={scanned?undefined:this.handleBarCodeScanned} style={StyleSheet.absoluteFill}/>
            )
        }
        else if(buttonState==="normal"){
        return(
           <KeyboardAvoidingView style = {styles.container}>
            <View style ={styles.inputView}>
            <TextInput  style= {styles.inputBox} placeholder= "book ID" onChangeText={text=>this.setState({scannedBookId:text})} value={this.state.scannedBookId}/>
            <TouchableOpacity  style={styles.scanButton} onPress={()=>{
                this.getCameraPermission("bookId")
            }}>
            <Text style= {styles.buttonText}> Scan </Text>
            </TouchableOpacity>
            </View>

            <View style ={styles.inputView}>
            <TextInput  style= {styles.inputBox} placeholder= "student ID"  onChangeText={text=>this.setState({scannedStudentId:text})} value = {this.state.scannedStudentId} />
            <TouchableOpacity  style={styles.scanButton}onPress={()=>{
                this.getCameraPermission("studentId")
            }}>
            <Text style= {styles.buttonText}> Scan </Text>
            </TouchableOpacity>
            </View>
            <TouchableOpacity  style={styles.submitButton} onPress={async()=>{
                var transactionMessage=await this.handleTransaction();
            }}>
                <Text style={styles.submitButtonText}> Submit</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        )

    }
}
}
const styles = StyleSheet.create({
displayText:{
    fontSize:15,
    textDecorationLine:'underline',

},
scanButton:{ 
    backgroundColor:'#7A4B4c',
    padding:10,
    margin:10,
},
buttonText:{
    fontSize:15,
    textAlign:'center',
    marginTop:10,
    
},
inputView:
{
flexDirection:'row',
margin:20,

},
inputBox:{
    width:200,
    height:40,
    borderWidth:1.5,
    borderRightWidth:0,
    fontSize:20,
    
},
scanButton:{
    backgroundColor:"#66BB6a",
    width:50,
    borderWidth:1.5,
    borderLeftWidth:0,

},
submitButton:{
backgroundColor:"#fbc02d",
width:100,
height:50,
},
submitButtonText:{
    padding:10,
    textAlign:'center',
    fontSize:20,
    fontWeight:'bold',
    color:"white",
}
})