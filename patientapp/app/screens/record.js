import React from 'react';
import { Text, View, Dimensions } from 'react-native';
import * as Permissions from 'expo-permissions';
import { Camera } from 'expo-camera';
import { Video}  from 'expo-av'

import FlowChooser from '../components/record/flow_chooser'
import FlowView from '../components/record/flow_view'
import RecordButton from '../components/record/record_button'
import ButtonList from '../components/record/button_list'

import sample_data from '../data/sample_flow';


const { width, height } = Dimensions.get("window");

const [NO_INTERACTION, INTERACTION_PENDING, INTERACTION_REVIEW, INTERACTION_RECORDING] = ['no_interaction', 'prending', 'review', 'INTERACTION_RECORDING'];

export default class CameraExample extends React.Component {
  state = {
    hasCameraPermission: null,
    chosen_interaction: null,
    interaction_step: 0,
    step_state: NO_INTERACTION, 
    video: null
  };

  styleSheet = {
    preview: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    container: {
      flex: 1,
      backgroundColor: "#111111",
      alignItems: 'center',
      justifyContent: "center",
    }

  }


   async componentDidMount() {
     this.choose_flow(0)
     await Permissions.askAsync([Permissions.CAMERA, Permissions.AUDIO_RECORDING])
      .then(({ status }) => this.setState({ permissionsOk: status === 'granted' }))
      .catch(err => console.log("error getting permissions", err))
  }


  choose_flow(i) {
    this.setState({
      chosen_interaction: sample_data[i].questions,
      interaction_step: 0,
      step_state: INTERACTION_PENDING
    })
  }

  async takeVideo() {
    if (this.camera) {
      try {
        return this.camera.recordAsync({options: {quality: "4:3"}})
          .then(video => this.setState({video,
            step_state: INTERACTION_REVIEW
          }))
      } catch (e) {
        console.error(e);
      }
    }
  };

  stopRecording() {
    this.camera.stopRecording();
  }

  record_button_pressed() {
    const { step_state } = this.state;
    if (step_state == INTERACTION_PENDING) {
      this.takeVideo();
      this.setState({
        step_state: INTERACTION_RECORDING
      });

    } else if (step_state == INTERACTION_RECORDING) {
      this.stopRecording();

    }
  }

  onFlowFinished() {
    this.setState({
      step_state: NO_INTERACTION
    });
  }

  onPreviewClick(item) {
    if (item == "Next") {
      this.setState({
        interaction_step: this.state.interaction_step + 1,
        step_state: INTERACTION_PENDING
      });
    } else if (item == "Re-take") {
      this.setState({
        step_state: INTERACTION_PENDING
      });
    }
  }

  getInteractiveButton(step_state, chosen_interaction, interaction_step) {
    if (step_state == INTERACTION_PENDING) {
      const stepType = chosen_interaction[interaction_step].type;
      if (stepType == 'PHOTO' || stepType == "VIDEO"){
        const buttonMode = stepType == "PHOTO" ? "picture" : "video";
        return <RecordButton
          onclick={this.record_button_pressed.bind(this)}
          mode={buttonMode}
          size={80} />
      } else if (stepType == "NEXT"){

        return <ButtonList items={["Next"]} onItemClick={this.onPreviewClick.bind(this)} />
      }
    } else if (step_state == INTERACTION_RECORDING) {
      return <RecordButton
        onclick={this.record_button_pressed.bind(this)}
        mode="recording"
        size={80} />
    } else if (step_state == INTERACTION_REVIEW) {
      return <ButtonList items={["Re-take","Next"]} onItemClick={this.onPreviewClick.bind(this)} />
    }
  }
  
  getCameraOrPreview(step_state) {
    const ratio_height = 4 * width / 3;
    if (step_state == INTERACTION_REVIEW ) {
      const {uri} = this.state.video;
      return <Video
        source={{ uri: uri }}
        rate={1.0}
        resizeMode="cover"
        volume={1.0}
        isMuted={false}
        shouldPlay
        isLooping
        style={{ height: ratio_height, width: width }}
      />
    } else {
      return <Camera
        style={{ height: ratio_height, width: width }}
        type={Camera.Constants.Type.front}
        ref={(ref) => this.camera = ref}
      >
      </Camera>
    }
  }

  getFlowOverlay(step_state, chosen_interaction, interaction_step){
    if (step_state == NO_INTERACTION) {
      return <FlowChooser flows={sample_data} onItemSelected={this.choose_flow.bind(this)} />
    } else  {
      return <FlowView flow={chosen_interaction} step_index={interaction_step} />
    }
  }

  render() {
    const { permissionsOk, chosen_interaction, step_state, interaction_step } = this.state;

    if (permissionsOk === null) {
      return <View />;
    } else if (permissionsOk === false) {
      return <Text>No access to camera or audio</Text>;
    } else {
      return (
        <View style={this.styleSheet.container}>
          <View
            style={{ position: "absolute", width: "100%", top: 10, zIndex: 2, flex: 1, justifyContent: "flex-start", alignItems: "center" }}>
            {
              this.getFlowOverlay(step_state, chosen_interaction, interaction_step)
            }
          </View>

          {this.getCameraOrPreview(step_state)}
          <View style={{ position: "absolute", width: "100%", bottom: 10, zIndex: 2, flex: 1, justifyContent: "flex-end", alignItems: "center" }}>
            {this.getInteractiveButton(step_state, chosen_interaction, interaction_step)}
          </View>
        </View>
      );
    }
  }
}
